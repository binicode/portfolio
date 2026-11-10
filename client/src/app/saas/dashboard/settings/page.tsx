import type { Metadata } from 'next';
import { getSaasMe } from '@/lib/saas-server';
import SettingsForm from './settings-form';

export const metadata: Metadata = {
  title: 'Settings',
};

export default async function SettingsPage() {
  const me = await getSaasMe();

  return (
    <div className="container-page py-[clamp(2.5rem,6vw,4.5rem)]">
      <div className="max-w-xl">
        <h1 className="font-wide text-h2 font-semibold">Settings</h1>
        <p className="mt-3 text-muted-foreground">Choose the accounts this dashboard tracks.</p>
        <SettingsForm
          initialGithubUsername={me.githubUsername ?? ''}
          initialYoutubeChannelId={me.youtubeChannelId ?? ''}
          initialBrandSearchQuery={me.brandSearchQuery ?? ''}
        />
      </div>
    </div>
  );
}
