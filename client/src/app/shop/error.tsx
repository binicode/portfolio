'use client';

import { useEffect } from 'react';

interface ShopErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ShopError({ error, reset }: ShopErrorPageProps) {
  useEffect(() => {
    console.error('Shop route error:', error);
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-4 text-gray-600">We couldn&apos;t load the shop. Try again in a moment.</p>
      <button
        onClick={reset}
        className="mt-6 inline-block rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        Try again
      </button>
    </section>
  );
}
