import { getSaasMe, getAggregatorStats } from '@/lib/saas-server';
import SubscribeButton from './subscribe-button';
import DashboardPreview from '@/components/saas/DashboardPreview';
import DashboardBody from '@/components/saas/DashboardBody';

export default async function SaasDashboardPage() {
  const me = await getSaasMe();

  if (me.subscriptionStatus !== 'active') {
    return (
      <div className="container-page py-[clamp(3rem,8vw,6rem)]">
        <div className="grid gap-10 border-y border-foreground/80 py-12 lg:grid-cols-12 lg:items-end lg:gap-8 lg:py-16">
          <div className="lg:col-span-8">
            <h1 className="text-h1 font-medium">Unlock your dashboard</h1>
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
      <h1 className="text-h2 font-medium">Your reach</h1>
      <div className="mt-8 lg:mt-10">
        <DashboardBody stats={stats} />
      </div>
    </div>
  );
}
