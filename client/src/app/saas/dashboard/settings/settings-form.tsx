'use client';

import { useState, type SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import { updateSaasSettings } from '@/lib/saas-client';
import { ApiError } from '@/lib/api-client';

interface SettingsFormProps {
  initialGithubUsername: string;
  initialYoutubeChannelId: string;
  initialBrandSearchQuery: string;
}

export default function SettingsForm({
  initialGithubUsername,
  initialYoutubeChannelId,
  initialBrandSearchQuery,
}: SettingsFormProps) {
  const router = useRouter();
  const [githubUsername, setGithubUsername] = useState(initialGithubUsername);
  const [youtubeChannelId, setYoutubeChannelId] = useState(initialYoutubeChannelId);
  const [brandSearchQuery, setBrandSearchQuery] = useState(initialBrandSearchQuery);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await updateSaasSettings({
        githubUsername: githubUsername.trim() || undefined,
        youtubeChannelId: youtubeChannelId.trim() || undefined,
        brandSearchQuery: brandSearchQuery.trim() || undefined,
      });
      router.push('/saas/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <label htmlFor="githubUsername" className="block text-sm font-medium">
          GitHub Username
        </label>
        <input
          id="githubUsername"
          type="text"
          value={githubUsername}
          onChange={(e) => setGithubUsername(e.target.value)}
          placeholder="octocat"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="youtubeChannelId" className="block text-sm font-medium">
          YouTube Channel ID
        </label>
        <input
          id="youtubeChannelId"
          type="text"
          value={youtubeChannelId}
          onChange={(e) => setYoutubeChannelId(e.target.value)}
          placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-gray-400">
          Not your @handle — the channel ID starting with &quot;UC&quot;, found on the channel&apos;s About page.
        </p>
      </div>

      <div>
        <label htmlFor="brandSearchQuery" className="block text-sm font-medium">
          Hacker News Search Query
        </label>
        <input
          id="brandSearchQuery"
          type="text"
          value={brandSearchQuery}
          onChange={(e) => setBrandSearchQuery(e.target.value)}
          placeholder="your name or project name"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {isSubmitting ? 'Saving…' : 'Save Settings'}
      </button>
    </form>
  );
}
