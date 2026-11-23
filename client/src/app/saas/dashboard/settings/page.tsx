import type { Metadata } from 'next';
import { requireSaasSession } from '@/lib/saas-server';
import SettingsForm from './settings-form';
import BillingPortalButton from './billing-portal-button';
import DeleteAccountForm from './delete-account-form';

export const metadata: Metadata = {
  title: 'Settings',
};

export default async function SettingsPage() {
  const me = await requireSaasSession();

  return (
    <div className="container-page py-[clamp(2.5rem,6vw,4.5rem)]">
      <div className="max-w-xl">
        <h1 className="text-h2 font-medium">Settings</h1>
        <p className="mt-3 text-muted-foreground">Choose what to track.</p>
        <SettingsForm
          initialGithubUsername={me.githubUsername ?? ''}
          initialYoutubeChannelId={me.youtubeChannelId ?? ''}
          initialBrandSearchQuery={me.brandSearchQuery ?? ''}
        />

        {me.hasBillingAccount && (
          <section aria-labelledby="billing-heading" className="mt-14 border-t border-border pt-8">
            <h2 id="billing-heading" className="text-h3 font-medium">
              Billing
            </h2>
            <p className="mt-2 mb-5 text-sm text-muted-foreground">Change your card, download invoices or cancel, on Stripe.</p>
            <BillingPortalButton />
          </section>
        )}

        <section aria-labelledby="delete-heading" className="mt-14 border-t border-border pt-8">
          <h2 id="delete-heading" className="text-h3 font-medium">
            Delete account
          </h2>
          <DeleteAccountForm hasSubscription={me.subscriptionStatus === 'active' || me.subscriptionStatus === 'past_due'} />
        </section>
      </div>
    </div>
  );
}
