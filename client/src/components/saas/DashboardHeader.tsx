import type { ReactNode } from 'react';

/**
 * The live dashboard's title row: a greeting, one line on source health, and
 * the refresh control on the right. The greeting needs only the session, so
 * it renders at once; the summary and control arrive with the numbers.
 */
export default function DashboardHeader({ name, summary, children }: { name: string; summary: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="text-title font-medium">Welcome back, {name}</h1>
        <div className="mt-1.5 flex min-h-6 items-center text-muted-foreground">{summary}</div>
      </div>
      <div className="flex min-h-9 items-center">{children}</div>
    </div>
  );
}

/** How the dashboard greets someone: their GitHub handle, else their email's local part. */
export function displayName(session: { email: string; githubUsername?: string }): string {
  return session.githubUsername?.trim() || session.email.split('@')[0];
}
