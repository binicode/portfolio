import type { ReactNode } from 'react';
import Link from 'next/link';
import { getSaasMe, getAggregatorStats } from '@/lib/saas-server';
import SubscribeButton from './subscribe-button';
import DashboardPreview from '@/components/saas/DashboardPreview';

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-semiwide text-2xl font-semibold tabular-nums">{value.toLocaleString('en-US')}</dd>
    </div>
  );
}

function ConnectCta({ label, description }: { label: string; description: string }) {
  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground">{description}</p>
      <Link href="/saas/dashboard/settings" className="link mt-4 inline-block text-sm font-medium">
        {label}
      </Link>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  const id = `panel-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <section aria-labelledby={id} className="rounded-lg border border-border bg-card p-6">
      <h2 id={id} className="font-semiwide text-h3 font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function SaasDashboardPage() {
  const me = await getSaasMe();

  if (me.subscriptionStatus !== 'active') {
    return (
      <div className="container-page py-[clamp(3rem,8vw,6rem)]">
        <div className="grid gap-10 border-y border-foreground/80 py-12 lg:grid-cols-12 lg:items-end lg:gap-8 lg:py-16">
          <div className="lg:col-span-8">
            <h1 className="font-wide text-h1 font-semibold">Unlock your dashboard</h1>
            <p className="mt-5 max-w-[36rem] text-lead text-muted-foreground">
              Subscribe to see your GitHub, YouTube and Hacker News numbers in one place. Checkout runs on Stripe, and
              the price is shown there before you pay.
            </p>
          </div>
          <div className="lg:col-span-4 lg:justify-self-end">
            <SubscribeButton />
          </div>
        </div>
        <DashboardPreview className="mt-12 lg:mt-16" />
      </div>
    );
  }

  const stats = await getAggregatorStats();

  return (
    <div className="container-page py-[clamp(2.5rem,6vw,4.5rem)]">
      <h1 className="font-wide text-h2 font-semibold">Your reach</h1>

      <div className="mt-8 grid gap-4 md:grid-cols-3 lg:mt-10">
        <Panel title="GitHub">
          {stats.github ? (
            <dl className="mt-4 divide-y divide-border">
              <MetricRow label="Followers" value={stats.github.followers} />
              <MetricRow label="Public repos" value={stats.github.publicRepos} />
              <MetricRow label="Total stars" value={stats.github.totalStars} />
            </dl>
          ) : (
            <ConnectCta label="Connect GitHub" description="Add your GitHub username to see your numbers here." />
          )}
        </Panel>

        <Panel title="YouTube">
          {stats.youtube ? (
            <dl className="mt-4 divide-y divide-border">
              <MetricRow label="Subscribers" value={stats.youtube.subscriberCount} />
              <MetricRow label="Total views" value={stats.youtube.viewCount} />
              <MetricRow label="Videos" value={stats.youtube.videoCount} />
            </dl>
          ) : (
            <ConnectCta label="Connect YouTube" description="Add your YouTube channel ID to see your numbers here." />
          )}
        </Panel>

        <Panel title="Hacker News">
          {stats.hackerNews ? (
            <div className="mt-4">
              <p className="font-semiwide text-h2 font-semibold tabular-nums">
                {stats.hackerNews.mentionCount.toLocaleString('en-US')}
              </p>
              <p className="text-sm text-muted-foreground">
                mention{stats.hackerNews.mentionCount === 1 ? '' : 's'}
              </p>
              {stats.hackerNews.recentTitles.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-border pt-4">
                  {stats.hackerNews.recentTitles.map((title, index) => (
                    <li key={index} className="truncate text-sm text-muted-foreground" title={title}>
                      {title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <ConnectCta label="Set up search" description="Add a search term to track Hacker News mentions." />
          )}
        </Panel>
      </div>
    </div>
  );
}
