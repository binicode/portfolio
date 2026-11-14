import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChartNoAxesColumn, LayoutDashboard, LogOut, MessagesSquare, Settings2, SquarePlay, Star } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { initials } from '@/components/saas/format';
import type { SaasMeResponse } from '@/types/saas';
import DashboardNavLinks from './DashboardNavLinks';
import LogoutButton from './LogoutButton';

const ICON = 'size-[1.125rem]';

function GroupLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="label mb-2 px-3 text-dim">
      {children}
    </p>
  );
}

/**
 * The dashboard's frame on desktop: product name and plan, pages, the
 * connected sources (each jumps to its section, or to Settings when it isn't
 * set), a way back to the portfolio, and the signed-in account. Server
 * rendered; only the page links (current-page state) and Log out are client.
 */
export default function DashboardSidebar({ session }: { session: SaasMeResponse }) {
  const pro = session.subscriptionStatus === 'active';
  const sources = [
    {
      label: 'GitHub',
      detail: session.githubUsername ? `@${session.githubUsername}` : null,
      href: '/saas/dashboard#repositories',
      icon: <Star className={ICON} strokeWidth={1.75} />,
    },
    {
      label: 'YouTube',
      detail: session.youtubeChannelId ? 'Channel connected' : null,
      href: '/saas/dashboard#views',
      icon: <SquarePlay className={ICON} strokeWidth={1.75} />,
    },
    {
      label: 'Hacker News',
      detail: session.brandSearchQuery ? `“${session.brandSearchQuery}”` : null,
      href: '/saas/dashboard#mentions',
      icon: <MessagesSquare className={ICON} strokeWidth={1.75} />,
    },
  ];

  return (
    <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto border-r border-border px-3 py-5 lg:flex">
      <div className="flex items-center justify-between gap-2 px-3">
        <Link href="/saas/dashboard" className="flex min-w-0 items-center gap-2.5 text-body-sm font-semibold tracking-tight">
          <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
            <ChartNoAxesColumn className="size-4" strokeWidth={2.25} />
          </span>
          <span className="truncate">Creator Dashboard</span>
        </Link>
        <Badge variant={pro ? 'primary' : 'muted'}>{pro ? 'Pro' : 'Free'}</Badge>
      </div>

      <div className="mt-8">
        <GroupLabel id="side-pages">Overview</GroupLabel>
        <DashboardNavLinks
          variant="sidebar"
          items={[
            { href: '/saas/dashboard', label: 'Dashboard', icon: <LayoutDashboard className={ICON} strokeWidth={1.75} /> },
            { href: '/saas/dashboard/settings', label: 'Settings', icon: <Settings2 className={ICON} strokeWidth={1.75} /> },
          ]}
        />
      </div>

      <div className="mt-7">
        <GroupLabel id="side-sources">Sources</GroupLabel>
        <ul aria-labelledby="side-sources" className="grid gap-1">
          {sources.map((source) => (
            <li key={source.label}>
              <Link
                href={source.detail ? source.href : '/saas/dashboard/settings'}
                className="side-link flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              >
                <span aria-hidden="true">{source.icon}</span>
                <span className="min-w-0">
                  <span className="block text-body-sm leading-tight">{source.label}</span>
                  <span className={`block truncate text-xs leading-tight ${source.detail ? 'text-dim' : 'text-accent-bright'}`}>
                    {source.detail ?? 'Not set'}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7">
        <GroupLabel id="side-site">Site</GroupLabel>
        <Link
          href="/"
          className="side-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-body-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <ArrowUpRight aria-hidden="true" className={ICON} strokeWidth={1.75} />
          Portfolio
        </Link>
      </div>

      <div className="mt-auto flex items-center gap-3 border-t border-border px-3 pt-4">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-accent/30 bg-accent/15 text-xs font-semibold text-accent-bright"
        >
          {initials(session.email)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm" title={session.email}>
            {session.email}
          </span>
          <span className="block text-xs text-dim">{pro ? 'Pro · Active' : 'Free plan'}</span>
        </span>
        <LogoutButton className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground disabled:opacity-40">
          <LogOut aria-hidden="true" className="size-4" strokeWidth={1.75} />
          <span className="sr-only">Log out</span>
        </LogoutButton>
      </div>
    </aside>
  );
}
