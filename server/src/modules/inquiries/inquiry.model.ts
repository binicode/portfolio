import { Schema, model } from 'mongoose';
import { RETENTION_DAYS, type Contact } from './inquiry.schema.js';

export interface InquiryDocument {
  name: string;
  contact: Contact;
  brief: string;
  transcript: Array<{ q: string; a: string[] }>;
  /** Set when the admin marks it read; null while new. */
  readAt: Date | null;
  createdAt: Date;
}

const transcriptEntrySchema = new Schema({ q: { type: String, required: true }, a: { type: [String], default: [] } }, { _id: false });

const inquirySchema = new Schema<InquiryDocument>(
  {
    name: { type: String, required: true },
    contact: {
      kind: { type: String, enum: ['email', 'linkedin'], required: true },
      value: { type: String, required: true },
    },
    brief: { type: String, required: true },
    transcript: { type: [transcriptEntrySchema], default: [] },
    readAt: { type: Date, default: null },
  },
  // No IP address or user agent: only what the visitor typed and chose.
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Retention: MongoDB's TTL monitor deletes each inquiry RETENTION_DAYS after
// it arrives (checked about once a minute). The same index serves the
// newest-first admin list. Changing the period later needs `collMod` on the
// existing index (or dropping it); Mongoose won't alter it in place.
inquirySchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 });

export const InquiryModel = model<InquiryDocument>('Inquiry', inquirySchema);
