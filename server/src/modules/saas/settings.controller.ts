import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../core/middleware/errorHandler.js';
import { SaasUserModel } from './saas-user.model.js';
import { settingsUpdate, updateSettingsBodySchema } from './settings.update.js';

/**
 * PATCH /saas/settings
 * Updates the current user's aggregator source identifiers. A field left
 * out is unchanged; an empty one disconnects that source (settings.update.ts).
 * No format validation beyond that — a malformed GitHub username or
 * YouTube channel ID doesn't need to be caught here, since the
 * aggregator already handles an invalid identifier gracefully (a null
 * result for that one source, not a crash).
 */
export const patchSettings = asyncHandler(async (req: Request, res: Response) => {
  const updates = settingsUpdate(updateSettingsBodySchema.parse(req.body));

  const user = await SaasUserModel.findByIdAndUpdate(req.user!.sub, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    githubUsername: user.githubUsername,
    youtubeChannelId: user.youtubeChannelId,
    brandSearchQuery: user.brandSearchQuery,
  });
});
