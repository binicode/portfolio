import type { Request, Response } from 'express';
import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { AppError } from '../../core/middleware/errorHandler.js';
import { ProjectModel } from './content.model.js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createProjectBodySchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(slugPattern, 'slug must be lowercase, alphanumeric, and hyphen-separated'),
  summary: z.string().min(1),
  techStack: z.array(z.string().min(1)).default([]),
  // http(s) only: these become links on public pages, so no javascript: or data: URLs.
  liveUrl: z.url({ protocol: /^https?$/, error: 'Use an http or https link.' }).optional(),
  repoUrl: z.url({ protocol: /^https?$/, error: 'Use an http or https link.' }).optional(),
  caseStudyBody: z.string().optional(),
  published: z.boolean().optional(),
});

const updateProjectBodySchema = createProjectBodySchema.partial();

const objectIdParamSchema = z.string().refine(isValidObjectId, { message: 'Invalid project id' });

// --- Admin-guarded handlers — mounted behind requireAdmin in content.routes.ts ---

export const createProject = async (req: Request, res: Response) => {
  const input = createProjectBodySchema.parse(req.body);
  const project = await ProjectModel.create(input);
  res.status(201).json(project);
};

export const listAllProjects = async (_req: Request, res: Response) => {
  const projects = await ProjectModel.find().sort({ createdAt: -1 });
  res.status(200).json(projects);
};

export const getProjectById = async (req: Request, res: Response) => {
  const id = objectIdParamSchema.parse(req.params.id);
  const project = await ProjectModel.findById(id);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.status(200).json(project);
};

export const updateProject = async (req: Request, res: Response) => {
  const id = objectIdParamSchema.parse(req.params.id);
  const updates = updateProjectBodySchema.parse(req.body);

  // runValidators defaults to false on findByIdAndUpdate — without it,
  // a partial update could silently bypass the schema's own validation
  // (e.g. slug format) on the fields being changed.
  const project = await ProjectModel.findByIdAndUpdate(id, updates, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.status(200).json(project);
};

export const deleteProject = async (req: Request, res: Response) => {
  const id = objectIdParamSchema.parse(req.params.id);
  const project = await ProjectModel.findByIdAndDelete(id);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.status(204).send();
};

// --- Public read-only handlers — no auth, used by the portfolio's public pages ---

export const listPublishedProjects = async (_req: Request, res: Response) => {
  const projects = await ProjectModel.find({ published: true }).sort({ createdAt: -1 });
  res.status(200).json(projects);
};

export const getPublishedProjectBySlug = async (req: Request, res: Response) => {
  const slug = z.string().min(1).parse(req.params.slug);
  const project = await ProjectModel.findOne({ slug, published: true });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.status(200).json(project);
};