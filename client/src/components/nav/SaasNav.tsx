import Badge from '@/components/ui/Badge';
import type { SubscriptionStatus } from '@/types/saas';
import DashboardNavLinks from './DashboardNavLinks';
import LogoutButton from './LogoutButton';

interface SaasNavProps {
  email: string;
  subscriptionStatus: SubscriptionStatus;
}

const LINKS = [
  { href: '/saas/dashboard', label: 'Dashboard' },
  { href: '/saas/dashboard/settings', label: 'Settings' },
];

/** Dashboard navigation for phones and tablets; the sidebar takes over from `lg`. */
export default function SaasNav({ email, subscriptionStatus }: SaasNavProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <DashboardNavLinks items={LINKS} variant="bar" />

      <div className="flex min-w-0 items-center gap-3">
        <Badge variant={subscriptionStatus === 'active' ? 'success' : 'muted'}>
          {subscriptionStatus === 'active' ? 'Pro' : 'Free'}
        </Badge>
        <span className="max-w-[12rem] truncate text-sm text-muted-foreground" title={email}>
          {email}
        </span>
        <LogoutButton className="label py-2 text-muted-foreground transition-colors duration-150 hover:text-foreground disabled:opacity-40" />
      </div>
    </div>
  );
}
