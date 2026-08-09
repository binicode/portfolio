'use client';

import { useState, type SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '@/lib/admin-client';
import { ApiError } from '@/lib/api-client';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [summary, setSummary] = useState('');
  const [techStack, setTechStack] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [caseStudyBody, setCaseStudyBody] = useState('');
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createProject({
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

  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl font-bold text-foreground">New Project</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Input label="Title" type="text" required value={title} onChange={(e) => handleTitleChange(e.target.value)} />

        <Input
          label="Slug"
          type="text"
          required
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugManuallyEdited(true);
          }}
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
            Publish immediately
          </label>
        </div>

        <Button type="submit" isLoading={isSubmitting} loadingText="Creating…">
          Create Project
        </Button>
      </form>
    </div>
  );
}
