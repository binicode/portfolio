'use client';

import { useState } from 'react';
import { createCheckoutSession } from '@/lib/saas-client';
import { ApiError } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function SubscribeButton() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setError(null);
    setIsLoading(true);

    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      <Button onClick={handleClick} isLoading={isLoading} loadingText="Redirecting…">
        Subscribe Now
      </Button>
    </div>
  );
}
