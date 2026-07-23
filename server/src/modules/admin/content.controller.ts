import type { Request, Response } from 'express';
import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { AppError, asyncHandler } from '../../core/middleware/errorHandler.js';
import { ProjectModel } from './content.model.js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createProjectBodySchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(slugPattern, 'slug must be lowercase, alphanumeric, and hyphen-separated'),
  summary: z.string().min(1),
  techStack: z.array(z.string().min(1)).default([]),
  liveUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  caseStudyBody: z.string().optional(),
  published: z.boolean().optional(),
});

const updateProjectBodySchema = createProjectBodySchema.partial();

const objectIdParamSchema = z.string().refine(isValidObjectId, { message: 'Invalid project id' });

// --- Admin-guarded handlers — mounted behind requireAuth + requireRole('admin') in content.routes.ts ---

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const input = createProjectBodySchema.parse(req.body);
  const project = await ProjectModel.create(input);
  res.status(201).json(project);
});

export const listAllProjects = asyncHandler(async (_req: Request, res: Response) => {
  const projects = await ProjectModel.find().sort({ createdAt: -1 });
  res.status(200).json(projects);
});

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const id = objectIdParamSchema.parse(req.params.id);
  const project = await ProjectModel.findById(id);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.status(200).json(project);
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const id = objectIdParamSchema.parse(req.params.id);
  const updates = updateProjectBodySchema.parse(req.body);

  // runValidators defaults to false on findByIdAndUpdate — without it,
  // a partial update could silently bypass the schema's own validation
  // (e.g. slug format) on the fields being changed.
  const project = await ProjectModel.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.status(200).json(project);
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const id = objectIdParamSchema.parse(req.params.id);
  const project = await ProjectModel.findByIdAndDelete(id);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.status(204).send();
});

// --- Public read-only handlers — no auth, used by the portfolio's public pages ---

export const listPublishedProjects = asyncHandler(async (_req: Request, res: Response) => {
  const projects = await ProjectModel.find({ published: true }).sort({ createdAt: -1 });
  res.status(200).json(projects);
});

export const getPublishedProjectBySlug = asyncHandler(async (req: Request, res: Response) => {
  const slug = z.string().min(1).parse(req.params.slug);
  const project = await ProjectModel.findOne({ slug, published: true });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.status(200).json(project);
});