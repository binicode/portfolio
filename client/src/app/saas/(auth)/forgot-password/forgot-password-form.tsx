'use client';

import { useState, type SubmitEvent } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/saas-client';
import { ApiError } from '@/lib/api-client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // The same answer for any address: the API never says whether it has an account.
  if (sent) {
    return (
      <div className="space-y-5" role="status">
        <h1 className="text-h2 font-medium">Check your inbox</h1>
        <p className="text-muted-foreground">
          If <span className="font-medium text-foreground">{email.trim()}</span> has an account, a reset link is on its
          way. It works once, for 30 minutes.
        </p>
        <p className="text-sm text-muted-foreground">
          <Link href="/saas/login" className="link font-medium text-foreground">
            Back to log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-h2 font-medium">Reset your password</h1>
        <p className="mt-2 text-muted-foreground">We&apos;ll email you a link to choose a new one.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

      <Button type="submit" isLoading={isSubmitting} loadingText="Sending…" className="w-full">
        Send reset link
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link href="/saas/login" className="link font-medium text-foreground">
          Log in
        </Link>
      </p>
    </form>
  );
}
