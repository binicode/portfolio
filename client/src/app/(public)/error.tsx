'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Logged client-side so a rendering failure is visible in the
    // browser console during development and in any error-tracking
    // tool wired up later — Next.js does not log this automatically.
    console.error('Public route error:', error);
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-4 text-gray-600">
        We couldn&apos;t load this page. This is usually temporary — try again in a moment.
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-block rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        Try again
      </button>
    </section>
  );
}