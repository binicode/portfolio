import type { ReactNode } from 'react';

/**
 * The app-window chrome around the sample-data dashboard: title bar with a
 * "Sample data" marker and the dashboard's (decorative) navigation, then the
 * page greeting. Shared by the interactive demo and the home page poster.
 */
export default function PreviewWindow({ inert = false, children }: { inert?: boolean; children: ReactNode }) {
  return (
    <div
      inert={inert}
      className="overflow-hidden rounded-xl border border-border bg-background shadow-[0_40px_80px_-40px_rgb(0_0_0/0.6)]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-3">
        <p className="text-caption font-semibold">Creator Dashboard</p>
        <div className="label flex items-center gap-4 text-muted-foreground">
          <span className="rounded-xs border border-accent/40 px-2 py-0.5 text-accent-bright">Sample data</span>
          <span aria-hidden="true" className="hidden text-foreground sm:inline">
            Dashboard
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            Settings
          </span>
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <p className="text-h3 font-medium">Welcome back, octocat</p>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">All 3 sources are live.</p>
        {children}
      </div>
    </div>
  );
}
