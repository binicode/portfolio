import { Schema, model, type HydratedDocument } from 'mongoose';
import type { SaasUserDocument, SubscriptionStatus } from './saas.types.js';

const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['none', 'active', 'canceled', 'past_due'];

const saasUserSchema = new Schema<SaasUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    subscriptionStatus: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      required: true,
      default: 'none',
    },
    githubUsername: { type: String, trim: true },
    youtubeChannelId: { type: String, trim: true },
    brandSearchQuery: { type: String, trim: true },
  },
  { timestamps: true },
);

export type SaasUserHydratedDocument = HydratedDocument<SaasUserDocument>;

export const SaasUserModel = model<SaasUserDocument>('SaasUser', saasUserSchema);
