'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { verifySaasEmail } from '@/lib/saas-client';
import { ApiError } from '@/lib/api-client';
import { useLinkToken } from '@/lib/link-token';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

/**
 * Confirms the address from the emailed link. A button rather than on page
 * load: mail scanners that open links can't use one up by themselves.
 */
export default function VerifyEmailForm() {
  const router = useRouter();
  const token = useLinkToken();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function confirm() {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await verifySaasEmail(token);
      router.push('/saas/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-h2 font-medium">Confirm your email</h1>
        <p className="mt-2 text-muted-foreground">One click to finish setting up your account.</p>
      </div>

      {token === null && (
        <Alert variant="error">This link is incomplete. Open it again from the email, or log in to get a new one.</Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      <Button onClick={confirm} disabled={!token} isLoading={isSubmitting} loadingText="Confirming…" className="w-full">
        Confirm and continue
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Link expired?{' '}
        <Link href="/saas/login" className="link font-medium text-foreground">
          Log in
        </Link>{' '}
        and ask for a new one.
      </p>
    </div>
  );
}
