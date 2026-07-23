import { Schema, model, type HydratedDocument } from 'mongoose';
import type { ProjectDocument } from './admin.types.js';

const projectSchema = new Schema<ProjectDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    summary: { type: String, required: true },
    techStack: { type: [String], default: [] },
    liveUrl: { type: String },
    repoUrl: { type: String },
    caseStudyBody: { type: String },
    // Defaults to false (draft) so a project created mid-edit in the CMS
    // never accidentally appears on the public portfolio before you
    // intend it to. Publishing is an explicit action, not a side effect
    // of saving.
    published: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

// The public portfolio's read path filters to published-only; the
// `slug` field already gets a unique index from the schema option
// above, so only `published` needs one added explicitly here.
projectSchema.index({ published: 1 });

export type ProjectHydratedDocument = HydratedDocument<ProjectDocument>;

export const ProjectModel = model<ProjectDocument>('Project', projectSchema);