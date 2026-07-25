import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { apiClient, ApiError } from '@/lib/api-client';
import type { Project } from '@/types/project';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

async function getProject(slug: string): Promise<Project> {
  try {
    return await apiClient.get<Project>(`/projects/${slug}`, {
      next: { revalidate: 60 },
    });
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProject(slug);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
      <p className="mt-4 text-lg text-gray-600">{project.summary}</p>

      {project.techStack.length > 0 && (
        <p className="mt-4 text-sm text-gray-400">{project.techStack.join(' · ')}</p>
      )}

      <div className="mt-6 flex gap-4">
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium underline"
          >
            Live site
          </a>
        )}
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium underline"
          >
            Source code
          </a>
        )}
      </div>

      {project.caseStudyBody && (
        <div className="mt-10 whitespace-pre-line text-gray-700">
          {/* Rendered as plain text for now — caseStudyBody is stored as
              markdown, so headings/bold/lists will show raw syntax
              until a markdown renderer (e.g. react-markdown) is added
              in a follow-up step. */}
          {project.caseStudyBody}
        </div>
      )}
    </article>
  );
}