'use client';

import { useState, type SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import { updateSaasSettings } from '@/lib/saas-client';
import { ApiError } from '@/lib/api-client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

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
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="GitHub Username"
        type="text"
        value={githubUsername}
        onChange={(e) => setGithubUsername(e.target.value)}
        placeholder="octocat"
      />

      <Input
        label="YouTube Channel ID"
        type="text"
        value={youtubeChannelId}
        onChange={(e) => setYoutubeChannelId(e.target.value)}
        placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
        hint="Not your @handle — the channel ID starting with 'UC', found on the channel's About page."
      />

      <Input
        label="Hacker News Search Query"
        type="text"
        value={brandSearchQuery}
        onChange={(e) => setBrandSearchQuery(e.target.value)}
        placeholder="your name or project name"
      />

      <Button type="submit" isLoading={isSubmitting} loadingText="Saving…">
        Save Settings
      </Button>
    </form>
  );
}
