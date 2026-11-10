'use client';

import { useEffect } from 'react';
import StatusMessage from '@/components/site/StatusMessage';
import Button from '@/components/ui/Button';
import ButtonLink from '@/components/ui/ButtonLink';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Logged client-side so a rendering failure is visible in the
    // browser console during development and in any error-tracking
    // tool wired up later — Next.js does not log this automatically.
    console.error('Public route error:', error);
  }, [error]);

  return (
    <StatusMessage
      title="This page didn’t load."
      actions={
        <>
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="secondary">
            Go to the home page
          </ButtonLink>
        </>
      }
    >
      <p>A service behind it didn’t respond. This is usually temporary, so try again in a moment.</p>
    </StatusMessage>
  );
}
