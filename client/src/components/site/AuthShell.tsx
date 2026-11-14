import Link from 'next/link';
import type { ReactNode } from 'react';
import { site } from '@/lib/site';

interface AuthShellProps {
  children: ReactNode;
  backHref: string;
  backLabel: string;
  /** Optional context panel shown beside the form on large screens. */
  aside?: ReactNode;
}

export default function AuthShell({ children, backHref, backLabel, aside }: AuthShellProps) {
  return (
    <div className={`grid min-h-dvh ${aside ? 'lg:grid-cols-2' : ''}`}>
      <div className="flex flex-col">
        <header className="container-page flex h-[var(--header-h)] items-center justify-between gap-6 border-b border-border lg:max-w-none">
          <Link href="/" className="whitespace-nowrap text-body-sm font-semibold tracking-tight">
            {site.name}
          </Link>
          <Link
            href={backHref}
            className="label whitespace-nowrap py-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {backLabel}
          </Link>
        </header>
        <main id="main" className="flex flex-1 items-center justify-center px-[var(--gutter)] py-16">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
      {aside && <aside className="theme-ink hidden flex-col justify-between p-12 lg:flex xl:p-16">{aside}</aside>}
    </div>
  );
}
