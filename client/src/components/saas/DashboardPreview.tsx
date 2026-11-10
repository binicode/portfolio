/**
 * A server-rendered replica of the Creator Dashboard, filled with sample
 * numbers. HTML instead of a screenshot: sharp at every size, a few KB,
 * and it can never drift into showing features the product lacks — the
 * panels mirror app/saas/dashboard/page.tsx.
 */

const SAMPLE = {
  github: [
    ['Followers', '1,284'],
    ['Public repos', '42'],
    ['Total stars', '3,917'],
  ],
  youtube: [
    ['Subscribers', '12,480'],
    ['Total views', '861,302'],
    ['Videos', '96'],
  ],
  hackerNews: {
    mentions: '18',
    titles: ['Show HN: A dashboard for creator metrics', 'Ask HN: How do you track your reach?', 'Launch: Creator analytics'],
  },
} as const;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <p className="text-[0.8125rem] font-semibold">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-[0.75rem] text-muted-foreground">{label}</dt>
      <dd className="font-semiwide text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export default function DashboardPreview({ className = '' }: { className?: string }) {
  return (
    <figure className={className}>
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_40px_80px_-40px_rgb(0_0_0/0.6)]"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-[0.8125rem] font-semibold">Creator Dashboard</p>
          <div className="flex items-center gap-3 text-[0.75rem] text-muted-foreground">
            <span className="rounded-full border border-success/40 px-2 py-0.5 text-success">Pro</span>
            <span className="hidden sm:inline">Dashboard</span>
            <span className="hidden sm:inline">Settings</span>
          </div>
        </div>
        <div className="grid gap-3 p-3 sm:grid-cols-3 sm:p-4">
          <Panel title="GitHub">
            <dl>
              {SAMPLE.github.map(([label, value]) => (
                <Metric key={label} label={label} value={value} />
              ))}
            </dl>
          </Panel>
          <Panel title="YouTube">
            <dl>
              {SAMPLE.youtube.map(([label, value]) => (
                <Metric key={label} label={label} value={value} />
              ))}
            </dl>
          </Panel>
          <Panel title="Hacker News">
            <p className="font-semiwide text-2xl font-semibold tabular-nums">{SAMPLE.hackerNews.mentions}</p>
            <p className="text-[0.75rem] text-muted-foreground">mentions</p>
            <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
              {SAMPLE.hackerNews.titles.map((title) => (
                <li key={title} className="truncate text-[0.75rem] text-muted-foreground">
                  {title}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
      <figcaption className="mt-3 text-[0.8125rem] text-muted-foreground">
        The Creator Dashboard, shown with sample data.
      </figcaption>
    </figure>
  );
}
