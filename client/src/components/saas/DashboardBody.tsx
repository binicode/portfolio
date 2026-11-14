import ChartFrame from './charts/ChartFrame';
import StatRail from './StatRail';
import FeatureTrends from './FeatureTrends';
import RepoShowcase from './RepoShowcase';
import ActivityFeed from './ActivityFeed';
import AccountCard, { type DashboardAccount } from './AccountCard';
import type { AggregatorStats } from '@/types/saas';

/**
 * - live: a subscriber's own numbers. Everything interactive, real links.
 * - demo: the public live demo on sample data. Interactive chart readouts,
 *   but external links are off, because the sample URLs aren't real.
 *
 * The home page's static poster doesn't use this component. It renders the
 * stat rail and the trend features without a chart frame, so the client
 * island imported here never reaches it.
 */
export type DashboardVariant = 'live' | 'demo';

/**
 * The Creator Dashboard below its greeting, composed in three bands of
 * different weight: a slim stat rail; two feature cards (7 / 5), each a
 * headline number with the chart that explains it; then the repository
 * showcase beside a narrow rail with the account and recent activity (8 / 4).
 * Every grid answers its own width (container queries), so the same body
 * works beside the sidebar and inside the demo window.
 */
export default function DashboardBody({
  stats,
  account,
  variant = 'live',
}: {
  stats: AggregatorStats;
  account: DashboardAccount;
  variant?: DashboardVariant;
}) {
  const live = variant === 'live';

  return (
    <div className="@container grid gap-4">
      <StatRail stats={stats} />

      <FeatureTrends stats={stats} links={live} Frame={ChartFrame} />

      <div className="grid items-start gap-4 @5xl:grid-cols-12">
        <RepoShowcase stats={stats} links={live} className="@5xl:col-span-8" />
        <div className="grid items-start gap-4 @3xl:grid-cols-2 @5xl:col-span-4 @5xl:grid-cols-1">
          <AccountCard
            account={account}
            stats={stats}
            cta={live ? { href: '/saas/dashboard/settings', label: 'Manage sources' } : { href: '/saas/signup', label: 'Try it with your accounts' }}
          />
          <ActivityFeed stats={stats} limit={5} links={live} />
        </div>
      </div>
    </div>
  );
}
