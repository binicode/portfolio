import Link from 'next/link';

type IconProps = { className?: string };

function GithubIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.22.7.83.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

function LinkedinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0Z" />
    </svg>
  );
}

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
    </svg>
  );
}

const socials = [
  // REPLACE '#' WITH YOUR REAL PROFILE URLS
  { label: 'GitHub', href: '#', Icon: GithubIcon },
  { label: 'LinkedIn', href: '#', Icon: LinkedinIcon },
  { label: 'Twitter / X', href: '#', Icon: XIcon },
];

const pages = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Shop', href: '/shop' },
  { label: 'SaaS Demo', href: '/saas/signup' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet to-indigo text-sm font-bold text-primary-foreground">
              BA
            </span>
            <span className="text-sm font-semibold tracking-tight">Biniyam Abera</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Full-Stack Engineer crafting high-performance SaaS and AI-driven products.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {pages.map((p) => (
            <Link
              key={p.label}
              href={p.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {p.label}
            </Link>
          ))}
        </nav>

        <div className="flex gap-2">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white/5 text-muted-foreground transition-all hover:scale-105 hover:text-foreground"
            >
              <s.Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl items-center justify-between border-t border-border pt-6 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Biniyam Abera. Built with Next.js.</p>
        <Link href="/login" className="text-muted-foreground/60 hover:text-muted-foreground">
          Admin
        </Link>
      </div>
    </footer>
  );
}
