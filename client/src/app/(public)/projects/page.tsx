import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import type { Project } from '@/types/project';
import Card from '@/components/ui/Card';

export default async function ProjectsPage() {
  const projects = await apiClient.get<Project[]>('/projects', {
    next: { revalidate: 60 },
  });

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Projects</h1>

      {projects.length === 0 ? (
        <p className="mt-6 text-muted">No projects published yet.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {projects.map((project) => (
            <Link key={project._id} href={`/projects/${project.slug}`}>
              <Card>
                <h2 className="text-xl font-bold text-foreground">{project.title}</h2>
                <p className="mt-2 text-sm text-muted">{project.summary}</p>
                {project.techStack.length > 0 && (
                  <p className="mt-3 text-xs text-secondary">{project.techStack.join(' · ')}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
