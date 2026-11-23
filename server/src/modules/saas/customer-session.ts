import { isValidObjectId } from 'mongoose';
import { requireSession, type AuthTokenPayload } from '../../core/middleware/auth.js';
import { SaasUserModel } from './saas-user.model.js';

/**
 * Creator Dashboard sessions. Each account has a token version; a token
 * issued under an older one (before a sign-out, for example) is refused,
 * and so is a token for an account that no longer exists.
 */
export async function customerTokenVersion(userId: string): Promise<number | null> {
  if (!isValidObjectId(userId)) return null;
  const user = await SaasUserModel.findById(userId, { tokenVersion: 1 }).lean();
  return user ? (user.tokenVersion ?? 0) : null;
}

/** Revokes every token issued so far for this account. */
export async function bumpCustomerTokenVersion(userId: string): Promise<void> {
  if (!isValidObjectId(userId)) return;
  await SaasUserModel.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
}

/**
 * Signs the account out everywhere, for a token that is still current. An
 * already revoked token changes nothing, so an old copy of a token cannot
 * end the sessions that came after it.
 */
export async function endCustomerSession(claims: AuthTokenPayload): Promise<void> {
  if ((await customerTokenVersion(claims.sub)) === claims.ver) await bumpCustomerTokenVersion(claims.sub);
}

/** Guards a Creator Dashboard route: a valid, unrevoked customer token. */
export const requireCustomer = requireSession('customer', customerTokenVersion);
