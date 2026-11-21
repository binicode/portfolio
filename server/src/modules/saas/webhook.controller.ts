import type { Request, Response } from 'express';
import { Schema, model } from 'mongoose';
import { asyncHandler, AppError } from '../../core/middleware/errorHandler.js';
import { verifyWebhookSignature } from './stripe.service.js';
import { SaasUserModel } from './saas-user.model.js';
import { handleStripeEvent, subscriptionUpdateFilter, type WebhookStore } from './stripe-events.js';

/**
 * Event ids already processed. Stripe retries a delivery for up to three
 * days, so ids are kept for 30 and then expire on their own (TTL index).
 */
const processedEventSchema = new Schema({
  _id: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
});
const ProcessedStripeEventModel = model('ProcessedStripeEvent', processedEventSchema);

const DUPLICATE_KEY = 11000;

const mongoStore: WebhookStore = {
  async claim(eventId) {
    try {
      await ProcessedStripeEventModel.create({ _id: eventId });
      return true;
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY) return false;
      throw error;
    }
  },
  async release(eventId) {
    await ProcessedStripeEventModel.deleteOne({ _id: eventId });
  },
  async apply(update) {
    const result = await SaasUserModel.updateOne(subscriptionUpdateFilter(update), {
      $set: {
        subscriptionStatus: update.status,
        stripeSubscriptionId: update.stripeSubscriptionId,
        subscriptionEventAt: update.eventAt,
      },
    });
    return result.matchedCount > 0;
  },
};

/**
 * POST /api/saas/billing/webhook
 * Mounted directly in app.ts with express.raw() BEFORE the global
 * express.json() middleware — req.body here is a Buffer, not a parsed
 * object, which verifyWebhookSignature requires. What each event does,
 * and why redeliveries and out-of-order events are safe, is in
 * stripe-events.ts. A failure answers 500, so Stripe retries.
 */
export const postStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];

  if (typeof signature !== 'string') {
    throw new AppError('Missing Stripe signature header', 400);
  }

  const event = verifyWebhookSignature(req.body as Buffer, signature);
  const outcome = await handleStripeEvent(event, mongoStore);

  res.status(200).json({ received: true, outcome });
});
