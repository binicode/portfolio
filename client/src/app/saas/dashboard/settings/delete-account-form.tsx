'use client';

import { useState, type SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import { deleteSaasAccount } from '@/lib/saas-client';
import { ApiError } from '@/lib/api-client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

/**
 * Deletes the account after the password is entered again. Any subscription
 * is cancelled at Stripe first, at once, with no further charges.
 */
export default function DeleteAccountForm({ hasSubscription }: { hasSubscription: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await deleteSaasAccount(password);
      router.replace('/saas/account-deleted');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <p className="text-sm text-muted-foreground">
        {hasSubscription
          ? 'Your subscription is cancelled at once, with no further charges, and your account and settings are deleted. This can’t be undone.'
          : 'Your account and settings are deleted. This can’t be undone.'}
      </p>
      {error && <Alert variant="error">{error}</Alert>}
      <Input
        label="Your password"
        id="delete-account-password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" variant="danger" isLoading={isSubmitting} loadingText="Deleting…">
        Delete my account
      </Button>
    </form>
  );
}
