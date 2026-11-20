import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { AppError, asyncHandler } from '../../core/middleware/errorHandler.js';
import { InquiryModel } from './inquiry.model.js';
import { inquiryBodySchema, isHoneypotFilled } from './inquiry.schema.js';

const LIST_LIMIT = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

// --- Public ---

/**
 * POST /api/inquiries
 * Stores a brief sent from the assistant's planner. A filled honeypot gets
 * the same reply as a real send, so a bot learns nothing, and is dropped.
 * Validation errors are field messages; anything else is the generic 500.
 */
export const postInquiry = asyncHandler(async (req: Request, res: Response) => {
  if (isHoneypotFilled(req.body)) {
    res.status(201).json({ ok: true });
    return;
  }
  const input = inquiryBodySchema.parse(req.body);
  await InquiryModel.create(input);
  res.status(201).json({ ok: true });
});

// --- Admin (mounted behind requireAuth + requireRole('admin')) ---

async function stats() {
  const [total, unread, last30Days] = await Promise.all([
    InquiryModel.countDocuments(),
    InquiryModel.countDocuments({ readAt: null }),
    InquiryModel.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * DAY_MS) } }),
  ]);
  return { total, unread, last30Days };
}

/** GET /api/admin/inquiries: newest first, with counts (the planner's conversion measure). */
export const listInquiries = asyncHandler(async (_req: Request, res: Response) => {
  const [items, counts] = await Promise.all([InquiryModel.find().sort({ createdAt: -1 }).limit(LIST_LIMIT).lean(), stats()]);
  res.status(200).json({ items, stats: counts });
});

/** GET /api/admin/inquiries/stats: counts only, for the admin nav. */
export const getInquiryStats = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(await stats());
});

const idSchema = z.string().refine(isValidObjectId, { message: 'Invalid inquiry id' });
const updateSchema = z.object({ read: z.boolean() });

/** PATCH /api/admin/inquiries/:id  { read: boolean } */
export const updateInquiry = asyncHandler(async (req: Request, res: Response) => {
  const id = idSchema.parse(req.params.id);
  const { read } = updateSchema.parse(req.body);
  const inquiry = await InquiryModel.findByIdAndUpdate(id, { readAt: read ? new Date() : null }, { new: true }).lean();
  if (!inquiry) throw new AppError('Inquiry not found', 404);
  res.status(200).json(inquiry);
});

/** DELETE /api/admin/inquiries/:id: for removal requests before the retention period ends. */
export const deleteInquiry = asyncHandler(async (req: Request, res: Response) => {
  const id = idSchema.parse(req.params.id);
  const inquiry = await InquiryModel.findByIdAndDelete(id);
  if (!inquiry) throw new AppError('Inquiry not found', 404);
  res.status(204).send();
});
