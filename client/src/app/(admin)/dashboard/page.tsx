import Link from 'next/link';
import { listAllProjects } from '@/lib/projects-admin-server';
import type { Project } from '@/types/project';
import Badge from '@/components/ui/Badge';
import ButtonLink from '@/components/ui/ButtonLink';

export default async function DashboardPage() {
  const projects = await listAllProjects();

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-wide text-h2 font-semibold">Projects</h1>
        <ButtonLink href="/dashboard/projects/new" size="sm">
          New project
        </ButtonLink>
      </div>

      {projects.length === 0 ? (
        <p className="mt-8 border-y border-border py-10 text-muted-foreground">
          No projects yet. Create your first one to publish it on the portfolio.
        </p>
      ) : (
        <ul className="mt-8 border-t border-border">
          {projects.map((project: Project) => (
            <li key={project._id} className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{project.title}</p>
                <p className="truncate text-sm text-muted-foreground">/projects/{project.slug}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={project.published ? 'success' : 'muted'}>
                  {project.published ? 'Published' : 'Draft'}
                </Badge>
                <Link href={`/dashboard/projects/${project._id}/edit`} className="link text-sm font-medium">
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
