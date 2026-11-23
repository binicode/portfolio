'use client';

import { useState, type SubmitEvent } from 'react';
import Link from 'next/link';
import { registerSaasUser } from '@/lib/saas-client';
import { ApiError } from '@/lib/api-client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function SaasSignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await registerSaasUser(email, password);
      setSentTo(email.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // The answer is the same for a new address and one that already has an
  // account (the API reveals nothing): either way, the inbox has the next step.
  if (sentTo) {
    return (
      <div className="space-y-5" role="status">
        <h1 className="text-h2 font-medium">Check your inbox</h1>
        <p className="text-muted-foreground">
          We sent an email to <span className="font-medium text-foreground">{sentTo}</span>. Open the link in it to confirm
          your address and sign in. It works for 24 hours.
        </p>
        <p className="text-sm text-muted-foreground">
          Nothing there after a few minutes? Check spam, or{' '}
          <button type="button" className="link font-medium text-foreground" onClick={() => setSentTo(null)}>
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-h2 font-medium">Create an account</h1>
        <p className="mt-2 text-muted-foreground">Free. Subscribe when you want your numbers.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={128}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint="At least 8 characters."
      />

      <Button type="submit" isLoading={isSubmitting} loadingText="Creating account…" className="w-full">
        Create account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/saas/login" className="link font-medium text-foreground">
          Log in
        </Link>
      </p>
    </form>
  );
}
