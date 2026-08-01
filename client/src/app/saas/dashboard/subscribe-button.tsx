'use client';

import { useState } from 'react';
import { createCheckoutSession } from '@/lib/saas-client';
import { ApiError } from '@/lib/api-client';

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
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="rounded-md bg-black px-6 py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        {isLoading ? 'Redirecting…' : 'Subscribe Now'}
      </button>
    </div>
  );
}
