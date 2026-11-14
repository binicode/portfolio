'use client';

import { useEffect } from 'react';
import './globals.css';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Last-resort boundary: replaces the root layout when it fails to render. */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Root layout error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="container-page py-24">
          <h1 className="text-h2 font-semibold">The site didn’t load.</h1>
          <p className="mt-4 max-w-[34rem] text-muted-foreground">
            Something went wrong. Try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex h-11 items-center rounded-xs bg-primary px-5 font-medium text-primary-foreground"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
