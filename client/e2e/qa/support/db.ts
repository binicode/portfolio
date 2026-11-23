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

async function findOne(collection: string, filter: object): Promise<Record<string, unknown> | null> {
  const { MongoClient } = serverRequire('mongodb') as { MongoClient: new (uri: string, options?: object) => MongoClientLike };
  const client = new MongoClient(QA.mongoUri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  try {
    return await client.db().collection(collection).findOne(filter);
  } finally {
    await client.close();
  }
}

export function findSaasUser(email: string): Promise<Record<string, unknown> | null> {
  return findOne('saasusers', { email: email.toLowerCase() });
}

/**
 * The admin's current token version (server admin-session.ts). Signing out
 * bumps it, and the local database keeps it between runs, so a token made
 * for the admin must carry it.
 */
export async function adminTokenVersion(): Promise<number> {
  const state = await findOne('admin_state', { _id: 'admin' });
  return typeof state?.tokenVersion === 'number' ? state.tokenVersion : 0;
}
