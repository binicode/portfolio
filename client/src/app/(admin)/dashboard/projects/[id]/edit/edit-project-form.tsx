'use client';

import { useState, type SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import { updateProject, deleteProject } from '@/lib/admin-client';
import { ApiError } from '@/lib/api-client';
import type { Project } from '@/types/project';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface EditProjectFormProps {
  project: Project;
}

export default function EditProjectForm({ project }: EditProjectFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(project.title);
  const [slug, setSlug] = useState(project.slug);
  const [summary, setSummary] = useState(project.summary);
  const [techStack, setTechStack] = useState(project.techStack.join(', '));
  const [liveUrl, setLiveUrl] = useState(project.liveUrl ?? '');
  const [repoUrl, setRepoUrl] = useState(project.repoUrl ?? '');
  const [caseStudyBody, setCaseStudyBody] = useState(project.caseStudyBody ?? '');
  const [published, setPublished] = useState(project.published);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await updateProject(project._id, {
        title,
        slug,
        summary,
        techStack: techStack
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
        liveUrl: liveUrl.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
        caseStudyBody: caseStudyBody.trim() || undefined,
        published,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Delete "${project.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProject(project._id);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete. Please try again.');
      setIsDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-foreground">Edit Project</h1>
        <Button variant="danger" onClick={handleDelete} isLoading={isDeleting} loadingText="Deleting…">
          Delete
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Input label="Title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />

        <Input
          label="Slug"
          type="text"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          hint="Lowercase letters, numbers, and hyphens only."
        />

        <Textarea label="Summary" required rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />

        <Input
          label="Tech Stack"
          type="text"
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          placeholder="React, Node.js, MongoDB"
          hint="Comma-separated."
        />

        <Input label="Live URL (optional)" type="url" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} />

        <Input label="Repo URL (optional)" type="url" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />

        <Textarea
          label="Case Study (optional)"
          rows={8}
          value={caseStudyBody}
          onChange={(e) => setCaseStudyBody(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <input
            id="published"
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-surface text-primary focus:ring-2 focus:ring-primary"
          />
          <label htmlFor="published" className="text-sm font-bold text-foreground">
            Published
          </label>
        </div>

        <Button type="submit" isLoading={isSubmitting} loadingText="Saving…">
          Save Changes
        </Button>
      </form>
    </div>
  );
}
