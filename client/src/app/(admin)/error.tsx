'use client';

import { useEffect } from 'react';
import StatusMessage from '@/components/site/StatusMessage';
import Button from '@/components/ui/Button';
import ButtonLink from '@/components/ui/ButtonLink';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Admin route error:', error);
  }, [error]);

  return (
    <StatusMessage
      title="This admin page didn’t load."
      actions={
        <>
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/dashboard" variant="secondary">
            Back to projects
          </ButtonLink>
        </>
      }
    >
      <p>The API didn’t respond, or your session expired. Try again.</p>
    </StatusMessage>
  );
}
