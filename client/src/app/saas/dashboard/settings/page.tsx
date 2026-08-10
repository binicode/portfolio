import { getSaasMe } from '@/lib/saas-server';
import SettingsForm from './settings-form';

export default async function SettingsPage() {
  const me = await getSaasMe();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-4xl font-bold text-foreground">Settings</h1>
      <p className="mt-2 text-muted">Configure the accounts this dashboard tracks.</p>
      <SettingsForm
        initialGithubUsername={me.githubUsername ?? ''}
        initialYoutubeChannelId={me.youtubeChannelId ?? ''}
        initialBrandSearchQuery={me.brandSearchQuery ?? ''}
      />
    </div>
  );
}
