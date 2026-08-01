import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../core/middleware/errorHandler.js';
import { SaasUserModel } from './saas-user.model.js';
import { getAggregatedStats } from './aggregator.service.js';

/**
 * GET /saas/aggregator
 * Returns the current user's aggregated cross-platform stats. By the
 * time this handler runs, requireAuth + requireRole('user') +
 * requireActiveSubscription (applied in aggregator.routes.ts) have
 * already confirmed both identity and payment status.
 */
export const getAggregatorStats = asyncHandler(async (req: Request, res: Response) => {
  const user = await SaasUserModel.findById(req.user!.sub);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const stats = await getAggregatedStats(user);
  res.status(200).json(stats);
});
