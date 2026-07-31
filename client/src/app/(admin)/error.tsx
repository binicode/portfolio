'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface AdminErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorPageProps) {
  useEffect(() => {
    console.error('Admin route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-4 text-gray-600">
        This is usually temporary, or your session may have expired.
      </p>
      <div className="mt-6 flex gap-4">
        <button
          onClick={reset}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Try again
        </button>
        <Link
          href="/login"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Log in again
        </Link>
      </div>
    </div>
  );
}
