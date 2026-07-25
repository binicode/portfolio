import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import type { Project } from '@/types/project';

export default async function ProjectsPage() {
  const projects = await apiClient.get<Project[]>('/projects', {
    next: { revalidate: 60 },
  });

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Projects</h1>

      {projects.length === 0 ? (
        <p className="mt-6 text-gray-600">No projects published yet.</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {projects.map((project) => (
            <li key={project._id} className="border-b pb-6">
              <Link href={`/projects/${project.slug}`} className="text-xl font-semibold hover:underline">
                {project.title}
              </Link>
              <p className="mt-2 text-gray-600">{project.summary}</p>
              {project.techStack.length > 0 && (
                <p className="mt-2 text-sm text-gray-400">{project.techStack.join(' · ')}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}