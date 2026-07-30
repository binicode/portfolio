import { notFound } from 'next/navigation';
import { getProjectById } from '@/lib/projects-admin-server';
import { ApiError } from '@/lib/api-client';
import EditProjectForm from './edit-project-form';

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;

  try {
    const project = await getProjectById(id);
    return <EditProjectForm project={project} />;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }
}
