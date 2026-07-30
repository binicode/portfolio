import Link from 'next/link';
import { listAllProjects } from '@/lib/projects-admin-server';
import type { Project } from '@/types/project';

export default async function DashboardPage() {
  const projects = await listAllProjects();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="mt-6 text-gray-600">No projects yet. Create your first one.</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="pb-2">Title</th>
              <th className="pb-2">Status</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project: Project) => (
              <tr key={project._id} className="border-b">
                <td className="py-2">{project.title}</td>
                <td className="py-2">
                  {project.published ? (
                    <span className="text-green-700">Published</span>
                  ) : (
                    <span className="text-gray-400">Draft</span>
                  )}
                </td>
                <td className="py-2 text-right">
                  <Link href={`/dashboard/projects/${project._id}/edit`} className="text-sm font-medium underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
