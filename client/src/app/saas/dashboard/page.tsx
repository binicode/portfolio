import { getSaasMe, getAggregatorStats } from '@/lib/saas-server';
import SubscribeButton from './subscribe-button';

export default async function SaasDashboardPage() {
  const me = await getSaasMe();

  if (me.subscriptionStatus !== 'active') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Unlock Your Dashboard</h1>
        <p className="mt-4 text-gray-600">
          Subscribe to see your aggregated GitHub, YouTube, and Hacker News stats in one place.
        </p>
        <div className="mt-6">
          <SubscribeButton />
        </div>
      </div>
    );
  }

  const stats = await getAggregatorStats();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-bold">Your Creator Dashboard</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h2 className="font-semibold">GitHub</h2>
          {stats.github ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Followers</dt>
                <dd>{stats.github.followers}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Public repos</dt>
                <dd>{stats.github.publicRepos}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total stars</dt>
                <dd>{stats.github.totalStars}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-gray-400">Not configured yet.</p>
          )}
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="font-semibold">YouTube</h2>
          {stats.youtube ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Subscribers</dt>
                <dd>{stats.youtube.subscriberCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total views</dt>
                <dd>{stats.youtube.viewCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Videos</dt>
                <dd>{stats.youtube.videoCount}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-gray-400">Not configured yet.</p>
          )}
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="font-semibold">Hacker News</h2>
          {stats.hackerNews ? (
            <div className="mt-4 text-sm">
              <p className="text-gray-500">
                {stats.hackerNews.mentionCount} mention{stats.hackerNews.mentionCount === 1 ? '' : 's'}
              </p>
              <ul className="mt-3 space-y-1">
                {stats.hackerNews.recentTitles.map((title, index) => (
                  <li key={index} className="truncate text-gray-700">
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-400">Not configured yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
