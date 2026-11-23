'use client';

import { useState } from 'react';
import { resendSaasVerification } from '@/lib/saas-client';
import { ApiError } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function ResendVerificationButton() {
  const [message, setMessage] = useState<{ variant: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setMessage(null);
    setIsLoading(true);
    try {
      await resendSaasVerification();
      setMessage({ variant: 'success', text: 'Sent. The new link works for 24 hours.' });
    } catch (err) {
      setMessage({ variant: 'error', text: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {message && (
        <div className="mb-4">
          <Alert variant={message.variant}>{message.text}</Alert>
        </div>
      )}
      <Button variant="secondary" onClick={handleClick} isLoading={isLoading} loadingText="Sending…">
        Send a new link
      </Button>
    </div>
  );
}
