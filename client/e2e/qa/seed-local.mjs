// Puts the e2e fixture case studies (e2e/fixtures/projects.json, plainly test
// data) into the QA run's local database before the client is built, and
// removes projects an interrupted admin journey left behind (slug "qa-run-*").
// Uses the server's MongoDB driver, so the client gains no dependency.
// With no database listening, it does nothing and the run goes on without one.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(here, '../../../server/package.json'));
const { MongoClient } = require('mongodb');

const uri = process.env.QA_MONGODB_URI;
if (!uri) throw new Error('seed-local.mjs: QA_MONGODB_URI is not set (run through playwright.qa.config.ts)');
const host = new URL(uri.replace(/^mongodb(\+srv)?:/, 'http:')).hostname;
if (uri.startsWith('mongodb+srv:') || !['127.0.0.1', 'localhost', '[::1]'].includes(host)) {
  throw new Error(`seed-local.mjs: QA_MONGODB_URI must point at this machine, got host "${host}"`);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
try {
  await client.connect();
} catch {
  console.log(`seed-local.mjs: no database at ${host}; nothing seeded`);
  process.exit(0);
}

try {
  const projects = client.db().collection('projects');
  const fixtures = JSON.parse(readFileSync(path.resolve(here, '../fixtures/projects.json'), 'utf8'));
  for (const fixture of fixtures) {
    // MongoDB assigns its own _id; the fixture's string id is for the mock API.
    const fields = Object.fromEntries(Object.entries(fixture).filter(([key]) => key !== '_id'));
    await projects.updateOne(
      { slug: fixture.slug },
      { $setOnInsert: { ...fields, createdAt: new Date(fixture.createdAt), updatedAt: new Date(fixture.updatedAt) } },
      { upsert: true },
    );
  }
  const leftovers = await projects.deleteMany({ slug: /^qa-run-/ });
  console.log(`seed-local.mjs: ${fixtures.length} fixture case studies present; ${leftovers.deletedCount} leftover QA projects removed`);
} finally {
  await client.close();
}
