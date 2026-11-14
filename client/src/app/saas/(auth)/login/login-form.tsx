'use client';

import { useState, type SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginSaasUser } from '@/lib/saas-client';
import { ApiError } from '@/lib/api-client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function SaasLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await loginSaasUser(email, password);
      router.push('/saas/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-h2 font-medium">Log in</h1>
        <p className="mt-2 text-muted-foreground">Welcome back.</p>
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
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button type="submit" isLoading={isSubmitting} loadingText="Logging in…" className="w-full">
        Log in
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/saas/signup" className="link font-medium text-foreground">
          Create one
        </Link>
      </p>
    </form>
  );
}
