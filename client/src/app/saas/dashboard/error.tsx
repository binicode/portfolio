'use client';

import { useEffect } from 'react';
import StatusMessage from '@/components/site/StatusMessage';
import Button from '@/components/ui/Button';

/**
 * Dashboard and settings failures stay inside the dashboard frame, so the
 * header and navigation remain usable. `retry` re-fetches the server
 * content; provider outages don't land here, because the stats API reports
 * those per source and the tiles show them.
 */
export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <StatusMessage
      title="This page didn’t load."
      actions={<Button onClick={() => retry()}>Try again</Button>}
    >
      <p>The service didn’t respond. Try again in a moment.</p>
    </StatusMessage>
  );
}
