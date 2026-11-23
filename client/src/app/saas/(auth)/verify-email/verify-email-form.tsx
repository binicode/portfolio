'use client';

import { useState, type SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { verifySaasEmail } from '@/lib/saas-client';
import { ApiError } from '@/lib/api-client';
import { useLinkToken } from '@/lib/link-token';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

/**
 * Confirms the address from the emailed link. The password chosen at
 * sign-up is asked for too: the link proves the inbox, the password proves
 * who signed up, so someone who typed another person's address can't end
 * up sharing their account. (A form also means mail scanners that open
 * links can't use one up.)
 */
export default function VerifyEmailForm() {
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
      await verifySaasEmail(token, password);
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
        <h1 className="text-h2 font-medium">Confirm your email</h1>
        <p className="mt-2 text-muted-foreground">Enter the password you chose when you signed up.</p>
      </div>

      {token === null && (
        <Alert variant="error">This link is incomplete. Open it again from the email, or sign up again for a new one.</Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button type="submit" disabled={!token} isLoading={isSubmitting} loadingText="Confirming…" className="w-full">
        Confirm and continue
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Link expired?{' '}
        <Link href="/saas/signup" className="link font-medium text-foreground">
          Sign up again
        </Link>{' '}
        for a new one. Forgot the password?{' '}
        <Link href="/saas/forgot-password" className="link font-medium text-foreground">
          Reset it
        </Link>
        .
      </p>
    </form>
  );
}
