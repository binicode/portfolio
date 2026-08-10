import Link from 'next/link';
import { getSaasMe, getAggregatorStats } from '@/lib/saas-server';
import Card from '@/components/ui/Card';
import SubscribeButton from './subscribe-button';

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-2xl font-bold text-foreground">{value.toLocaleString()}</span>
    </div>
  );
}

function ConnectCta({ label }: { label: string }) {
  return (
    <Link
      href="/saas/dashboard/settings"
      className="mt-4 inline-block rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
    >
      {label}
    </Link>
  );
}

export default async function SaasDashboardPage() {
  const me = await getSaasMe();

  if (me.subscriptionStatus !== 'active') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-[20px] bg-gradient-to-br from-primary to-secondary p-8 text-center shadow-lg shadow-primary/30">
          <h1 className="text-4xl font-bold text-foreground">Unlock Your Dashboard</h1>
          <p className="mt-3 text-foreground/90">
            Subscribe to see your aggregated GitHub, YouTube, and Hacker News stats in one place.
          </p>
          <div className="mt-6">
            <SubscribeButton />
          </div>
        </div>
      </div>
    );
  }

  const stats = await getAggregatorStats();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold text-foreground">Your Creator Dashboard</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <Card>
          <h2 className="text-lg font-bold text-foreground">GitHub</h2>
          {stats.github ? (
            <div className="mt-4 space-y-3">
              <MetricRow label="Followers" value={stats.github.followers} />
              <MetricRow label="Public repos" value={stats.github.publicRepos} />
              <MetricRow label="Total stars" value={stats.github.totalStars} />
            </div>
          ) : (
            <div>
              <p className="mt-4 text-sm text-muted">Connect your GitHub username to see stats here.</p>
              <ConnectCta label="Connect GitHub" />
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-foreground">YouTube</h2>
          {stats.youtube ? (
            <div className="mt-4 space-y-3">
              <MetricRow label="Subscribers" value={stats.youtube.subscriberCount} />
              <MetricRow label="Total views" value={stats.youtube.viewCount} />
              <MetricRow label="Videos" value={stats.youtube.videoCount} />
            </div>
          ) : (
            <div>
              <p className="mt-4 text-sm text-muted">Connect your YouTube channel to see stats here.</p>
              <ConnectCta label="Connect YouTube" />
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-foreground">Hacker News</h2>
          {stats.hackerNews ? (
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">{stats.hackerNews.mentionCount.toLocaleString()}</p>
              <p className="text-sm text-muted">mention{stats.hackerNews.mentionCount === 1 ? '' : 's'}</p>
              <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-4">
                {stats.hackerNews.recentTitles.map((title, index) => (
                  <li key={index} className="truncate text-xs text-muted">
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <p className="mt-4 text-sm text-muted">Set a search query to track mentions here.</p>
              <ConnectCta label="Set Up Search" />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
