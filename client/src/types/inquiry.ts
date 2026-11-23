/** A brief sent from the assistant's planner (server: modules/inquiries). */
export interface Inquiry {
  _id: string;
  name: string;
  contact: { kind: 'email' | 'linkedin'; value: string };
  brief: string;
  transcript: Array<{ q: string; a: string[] }>;
  /** Null while new. */
  readAt: string | null;
  createdAt: string;
}

export interface InquiryStats {
  total: number;
  unread: number;
  last30Days: number;
}

export interface InquiryList {
  items: Inquiry[];
  stats: InquiryStats;
}
