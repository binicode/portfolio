'use client';

import { useState, useSyncExternalStore, useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { refreshDashboard } from '@/app/saas/dashboard/actions';
import { formatTimeAgo } from './format';

const TICK_MS = 30_000;

// A clock that ticks every 30 s. The snapshot is bucketed, so it is stable
// between ticks; on the server there is no clock (null), so the first client
// render matches the HTML and only then shows the relative time.
function subscribe(onTick: () => void) {
  const id = setInterval(onTick, TICK_MS);
  return () => clearInterval(id);
}
const clientNow = () => Math.floor(Date.now() / TICK_MS) * TICK_MS;
const serverNow = () => null;

/**
 * "Updated 3 minutes ago" plus a Refresh button that re-renders the
 * dashboard's server components with fresh provider data.
 *
 * The refresh is a server action: its response carries the new tree, and the
 * transition stays pending until that tree is on screen, so "Refreshing…"
 * ends exactly when the new numbers appear.
 */
export default function RefreshControl({ fetchedAt }: { fetchedAt: string }) {
  const [refreshing, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const now = useSyncExternalStore(subscribe, clientNow, serverNow);

  const refresh = () => {
    setFailed(false);
    startTransition(async () => {
      try {
        await refreshDashboard();
      } catch {
        setFailed(true);
      }
    });
  };

  // Bucketed time can trail the fetch by up to a tick: never show a future time.
  const ago = now === null ? 'just now' : formatTimeAgo(fetchedAt, Math.max(now, Date.parse(fetchedAt)));

  return (
    <div className="flex items-center gap-3">
      <p aria-live="polite" className="label text-muted-foreground">
        {refreshing ? (
          'Refreshing…'
        ) : failed ? (
          <span className="text-destructive">Couldn’t refresh. Try again.</span>
        ) : (
          <>
            Updated <time dateTime={fetchedAt}>{ago}</time>
          </>
        )}
      </p>
      <button
        type="button"
        onClick={refresh}
        disabled={refreshing}
        className="label inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-foreground transition-colors duration-150 hover:border-foreground/40 disabled:cursor-progress disabled:opacity-60"
      >
        <RefreshCw aria-hidden="true" className={`size-3.5 ${refreshing ? 'motion-safe:animate-spin' : ''}`} strokeWidth={2} />
        Refresh
      </button>
    </div>
  );
}
