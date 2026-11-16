// Runs the QA suite one device at a time: desktop (which builds the client),
// then tablet and phone against the same build. Each run starts a fresh API,
// so no run exceeds the API's auth limit of 10 attempts per 15 minutes per IP.
//
//   npm run test:qa                     all three devices
//   npm run test:qa -- desktop          one device
//   QA_SKIP_BUILD=1 npm run test:qa     reuse the last QA build

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const clientDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const requested = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
const devices = requested.length > 0 ? requested : ['desktop', 'tablet', 'mobile'];
const passThrough = process.argv.slice(2).filter((arg) => arg.startsWith('-'));
const cli = path.join(clientDir, 'node_modules', '@playwright', 'test', 'cli.js');

let failed = false;
devices.forEach((device, index) => {
  const skipBuild = process.env.QA_SKIP_BUILD === '1' || index > 0;
  console.log(`\n=== QA: ${device}${skipBuild ? '' : ' (building the client first)'} ===\n`);
  const result = spawnSync(
    process.execPath,
    [cli, 'test', '-c', 'e2e/qa/playwright.qa.config.ts', `--project=${device}`, ...passThrough],
    { cwd: clientDir, stdio: 'inherit', env: { ...process.env, QA_SKIP_BUILD: skipBuild ? '1' : '0' } },
  );
  if (result.status !== 0) failed = true;
});
process.exit(failed ? 1 : 0);
