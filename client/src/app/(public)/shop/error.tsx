'use client';

import { useEffect } from 'react';
import StatusMessage from '@/components/site/StatusMessage';
import Button from '@/components/ui/Button';
import ButtonLink from '@/components/ui/ButtonLink';

interface ShopErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ShopError({ error, reset }: ShopErrorPageProps) {
  useEffect(() => {
    console.error('Shop route error:', error);
  }, [error]);

  return (
    <StatusMessage
      title="The shop didn’t load."
      actions={
        <>
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="secondary">
            Go to the home page
          </ButtonLink>
        </>
      }
    >
      <p>Shopify didn’t respond. Try again in a moment.</p>
    </StatusMessage>
  );
}
