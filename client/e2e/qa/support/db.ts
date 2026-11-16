import { createRequire } from 'node:module';
import path from 'node:path';
import { QA } from '../settings';

/**
 * Read access to the QA run's local database, for facts the API doesn't
 * expose (the Stripe customer id a checkout stored). Uses the server's own
 * MongoDB driver, so the client gains no dependency. Only ever QA.mongoUri,
 * which start-api.mjs has already checked is on this machine.
 */
const serverRequire = createRequire(path.resolve(__dirname, '../../../../server/package.json'));

interface MongoClientLike {
  connect(): Promise<unknown>;
  close(): Promise<void>;
  db(): { collection(name: string): { findOne(filter: object): Promise<Record<string, unknown> | null> } };
}

export async function findSaasUser(email: string): Promise<Record<string, unknown> | null> {
  const { MongoClient } = serverRequire('mongodb') as { MongoClient: new (uri: string, options?: object) => MongoClientLike };
  const client = new MongoClient(QA.mongoUri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  try {
    return await client.db().collection('saasusers').findOne({ email: email.toLowerCase() });
  } finally {
    await client.close();
  }
}
