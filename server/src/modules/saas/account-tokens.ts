import { createHash, randomBytes } from 'node:crypto';
import { Schema, Types, model } from 'mongoose';
import { z } from 'zod';

/**
 * Single-use links for email confirmation and password resets.
 *
 * The link carries 32 random bytes; the database keeps only their SHA-256,
 * so a copy of the database can't be turned into working links. A token is
 * deleted when used (so it works once) and expires on its own (TTL index).
 * Issuing a new one for the same purpose replaces the account's earlier
 * one: only the latest link works.
 */

export type AccountTokenPurpose = 'verify-email' | 'reset-password';

export const TOKEN_LIFETIME_MS: Record<AccountTokenPurpose, number> = {
  'verify-email': 24 * 60 * 60 * 1000,
  'reset-password': 30 * 60 * 1000,
};

const accountTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    purpose: { type: String, enum: ['verify-email', 'reset-password'], required: true },
    tokenHash: { type: String, required: true, unique: true },
    // MongoDB deletes the document once this time has passed (about a minute later).
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const AccountTokenModel = model('AccountToken', accountTokenSchema, 'account_tokens');

/** What a link's token looks like: 32 bytes, base64url. Checked before any query. */
export const accountTokenSchemaInput = z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'This link is not valid.');

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

/** Creates a token for the account and returns it (only its hash is stored). */
export async function issueAccountToken(userId: Types.ObjectId | string, purpose: AccountTokenPurpose): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await AccountTokenModel.deleteMany({ userId, purpose });
  await AccountTokenModel.create({
    userId,
    purpose,
    tokenHash: hash(token),
    expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS[purpose]),
  });
  return token;
}

/** When the account's current token for this purpose was issued, if it has one. */
export async function lastIssuedAt(userId: Types.ObjectId | string, purpose: AccountTokenPurpose): Promise<Date | null> {
  const token = await AccountTokenModel.findOne({ userId, purpose }, { createdAt: 1 }).lean();
  return (token?.createdAt as Date | undefined) ?? null;
}

/**
 * Uses a token: returns its account id and deletes it, or null when it is
 * unknown, expired or already used. One atomic operation, so two requests
 * racing with the same link can't both succeed.
 */
export async function consumeAccountToken(token: string, purpose: AccountTokenPurpose): Promise<Types.ObjectId | null> {
  const used = await AccountTokenModel.findOneAndDelete({ tokenHash: hash(token), purpose, expiresAt: { $gt: new Date() } }).lean();
  return used ? (used.userId as Types.ObjectId) : null;
}

/** Removes every outstanding link for the account (all purposes). */
export async function deleteAccountTokens(userId: Types.ObjectId | string): Promise<void> {
  await AccountTokenModel.deleteMany({ userId });
}
