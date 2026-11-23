import { Schema, model } from 'mongoose';
import { requireSession, type AuthTokenPayload } from '../../core/middleware/auth.js';

/**
 * The CMS admin's session state. The admin account itself is configured in
 * the environment (ADMIN_EMAIL, ADMIN_PASSWORD_HASH); this one document
 * holds its token version, so signing out revokes every admin token issued
 * before (auth.ts).
 */
const ADMIN_ID = 'admin';

const adminStateSchema = new Schema({
  _id: { type: String, required: true },
  tokenVersion: { type: Number, required: true, default: 0 },
});

const AdminStateModel = model('AdminState', adminStateSchema, 'admin_state');

export async function adminTokenVersion(): Promise<number> {
  const state = await AdminStateModel.findById(ADMIN_ID).lean();
  return state?.tokenVersion ?? 0;
}

/** Revokes every admin token issued so far. */
export async function bumpAdminTokenVersion(): Promise<void> {
  await AdminStateModel.updateOne({ _id: ADMIN_ID }, { $inc: { tokenVersion: 1 } }, { upsert: true });
}

/** Signs the admin out everywhere, for a token that is still current (see endCustomerSession). */
export async function endAdminSession(claims: AuthTokenPayload): Promise<void> {
  if (claims.sub === ADMIN_ID && (await adminTokenVersion()) === claims.ver) await bumpAdminTokenVersion();
}

/** Guards an admin route: a valid, unrevoked admin token. */
export const requireAdmin = requireSession('admin', async (sub) => (sub === ADMIN_ID ? adminTokenVersion() : null));

export { ADMIN_ID };
