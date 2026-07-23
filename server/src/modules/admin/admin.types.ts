export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminLoginResult {
  token: string;
}

export interface ProjectDocument {
  title: string;
  slug: string;
  summary: string;
  techStack: string[];
  liveUrl?: string;
  repoUrl?: string;
  caseStudyBody?: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  title: string;
  slug: string;
  summary: string;
  techStack: string[];
  liveUrl?: string;
  repoUrl?: string;
  caseStudyBody?: string;
  published?: boolean;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;