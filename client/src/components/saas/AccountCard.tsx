import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { AggregatorStats } from '@/types/saas';
import { initials } from './format';
import { sourceSummary } from './insights';

export interface DashboardAccount {
  /** Display handle: the GitHub username, or the email's local part. */
  name: string;
  email: string;
  plan: 'pro' | 'free';
}

/**
 * Who is signed in, whether every source answered, and the one next step.
 * Compact on purpose: the audience figures live in the stat rail and the top
 * repository's share in the repository feature, so nothing repeats here.
 */
export default function AccountCard({
  account,
  stats,
  cta,
  className = '',
}: {
  account: DashboardAccount;
  stats: AggregatorStats;
  cta: { href: string; label: string };
  className?: string;
}) {
  const summary = sourceSummary(stats.sources);
  const allLive = summary.live === summary.total;

  return (
    <section aria-labelledby="account-title" className={`dash-card min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5 ${className}`}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-accent/30 bg-accent/15 text-xs font-semibold text-accent-bright"
        >
          {initials(account.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="account-title" className="truncate text-body-sm font-medium">
            {account.name}
          </h2>
          <p className="truncate text-xs text-muted-foreground" title={account.email}>
            {account.email}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium ${
            account.plan === 'pro' ? 'border-accent/35 bg-accent/10 text-accent-bright' : 'border-border text-muted-foreground'
          }`}
        >
          {account.plan === 'pro' ? 'Pro' : 'Free'}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Sources live</span>
          <span className="font-medium tabular-nums">
            {summary.live} / {summary.total}
          </span>
        </div>
        <div aria-hidden="true" className="mt-2 flex h-1.5 gap-1">
          {Array.from({ length: summary.total }, (_, index) => (
            <span key={index} className={`flex-1 rounded-full ${index < summary.live ? (allLive ? 'bg-success' : 'bg-accent') : 'bg-muted'}`} />
          ))}
        </div>
        {!allLive && <p className="mt-2 text-xs text-muted-foreground">{summary.text}</p>}
      </div>

      <Link
        href={cta.href}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-[filter] duration-150 hover:brightness-110"
      >
        {cta.label}
        <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.25} />
      </Link>
    </section>
  );
}
