import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { contactHref, primaryNav, site, socials } from '@/lib/site';

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="theme-ink">
      {/* Extra bottom padding keeps the last row clear of the fixed assistant button. */}
      <div className="container-page pb-24 pt-[calc(var(--section)*0.8)]">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <p className="font-wide text-h1 font-semibold text-balance lg:col-span-8">Have something that needs to hold up?</p>
          <div className="lg:col-span-4 lg:justify-self-end">
            <a
              href={contactHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/88"
            >
              Message me on LinkedIn
              <ArrowUpRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={1.75}
              />
            </a>
          </div>
        </div>

        <div className="mt-16 grid gap-10 border-t border-border pt-10 sm:grid-cols-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="font-semiwide font-semibold">{site.name}</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              {site.role} with a background in civil engineering.
            </p>
          </div>

          <nav aria-label="Footer" className="lg:col-span-3">
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
                  Home
                </Link>
              </li>
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="space-y-2.5 text-sm lg:col-span-3">
            {socials.map((social) => (
              <li key={social.href}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {social.label}
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <p>
            © {year} {site.name}
          </p>
          <Link href="/login" className="transition-colors hover:text-foreground" rel="nofollow">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
