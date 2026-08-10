'use client';

import { useState, type SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginSaasUser } from '@/lib/saas-client';
import { ApiError } from '@/lib/api-client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function SaasLoginPage() {
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
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Log In</h1>

        {error && <Alert variant="error">{error}</Alert>}

        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <Input
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" isLoading={isSubmitting} loadingText="Logging in…" className="w-full">
          Log in
        </Button>

        <p className="text-center text-sm text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/saas/signup" className="font-bold text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
