import Link from 'next/link';
import { listAllProjects } from '@/lib/projects-admin-server';
import type { Project } from '@/types/project';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default async function DashboardPage() {
  const projects = await listAllProjects();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-foreground">Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
        >
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="mt-6 text-muted">No projects yet. Create your first one.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: Project) => (
            <Card key={project._id}>
              <div className="flex items-start justify-between">
                <h2 className="font-bold text-foreground">{project.title}</h2>
                <Badge variant={project.published ? 'success' : 'muted'}>
                  {project.published ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <Link
                href={`/dashboard/projects/${project._id}/edit`}
                className="mt-4 inline-block text-sm font-bold text-primary hover:underline"
              >
                Edit
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
