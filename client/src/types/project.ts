export interface Project {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  techStack: string[];
  liveUrl?: string;
  repoUrl?: string;
  caseStudyBody?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}
