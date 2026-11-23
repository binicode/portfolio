'use client';

import { useState, type SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { resetSaasPassword } from '@/lib/saas-client';
import { ApiError } from '@/lib/api-client';
import { useLinkToken } from '@/lib/link-token';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function ResetPasswordForm() {
  const router = useRouter();
  const token = useLinkToken();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await resetSaasPassword(token, password);
      router.push('/saas/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-h2 font-medium">Choose a new password</h1>
        <p className="mt-2 text-muted-foreground">Every device signed in to your account will be signed out.</p>
      </div>

      {token === null && (
        <Alert variant="error">
          This link is incomplete. Open it again from the email, or{' '}
          <Link href="/saas/forgot-password" className="link font-medium">
            ask for a new one
          </Link>
          .
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={128}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint="At least 8 characters."
      />

      <Button type="submit" disabled={!token} isLoading={isSubmitting} loadingText="Saving…" className="w-full">
        Save and sign in
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Link expired?{' '}
        <Link href="/saas/forgot-password" className="link font-medium text-foreground">
          Ask for a new one
        </Link>
      </p>
    </form>
  );
}
