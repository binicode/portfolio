import { notFound } from 'next/navigation';
import { getProjectById } from '@/lib/projects-admin-server';
import { ApiError } from '@/lib/api-client';
import EditProjectForm from './edit-project-form';

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;

  let project;
  try {
    project = await getProjectById(id);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }

  return <EditProjectForm project={project} />;
}
