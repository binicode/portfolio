import { Suspense } from 'react';
import { getSaasMe, getAggregatorStats } from '@/lib/saas-server';
import SubscribeButton from './subscribe-button';
import DashboardPreview from '@/components/saas/DashboardPreview';
import DashboardBody from '@/components/saas/DashboardBody';
import DashboardHeader, { displayName } from '@/components/saas/DashboardHeader';
import DashboardSkeleton from '@/components/saas/DashboardSkeleton';
import RefreshControl from '@/components/saas/RefreshControl';
import { sourceSummary } from '@/components/saas/insights';
import type { SaasMeResponse } from '@/types/saas';

export default async function SaasDashboardPage() {
  const me = await getSaasMe();

  if (me.subscriptionStatus !== 'active') {
    return (
      <div className="container-page py-[clamp(3rem,8vw,6rem)]">
        <div className="grid gap-10 border-y border-foreground/80 py-12 lg:grid-cols-12 lg:items-end lg:gap-8 lg:py-16">
          <div className="lg:col-span-8">
            <h1 className="text-h1 font-medium">Unlock your dashboard</h1>
            <p className="mt-5 max-w-[36rem] text-lead text-muted-foreground">
              Subscribe to see your reach. The price shows at checkout.
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

  // The heading renders at once and the numbers (live provider calls, often
  // the slowest part of the request) stream in behind a skeleton. The
  // boundary sits here rather than in a route-level loading.tsx so the
  // subscription check runs first (locked users never see a dashboard
  // skeleton) and Settings doesn't inherit this page's skeleton.
  return (
    <div className="container-page py-6 sm:py-8 lg:py-10">
      <Suspense fallback={<DashboardSkeleton name={displayName(me)} />}>
        <LiveDashboard session={me} />
      </Suspense>
    </div>
  );
}

async function LiveDashboard({ session }: { session: SaasMeResponse }) {
  const stats = await getAggregatorStats();
  const name = displayName(session);

  return (
    <>
      <DashboardHeader name={name} summary={sourceSummary(stats.sources).text}>
        <RefreshControl fetchedAt={stats.fetchedAt} />
      </DashboardHeader>
      <div className="mt-6 lg:mt-8">
        <DashboardBody stats={stats} variant="live" account={{ name, email: session.email, plan: 'pro' }} />
      </div>
    </>
  );
}
