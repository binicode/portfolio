import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import OpenChatButton from '@/components/chat/OpenChatButton';
import { buttonClasses } from '@/components/ui/button-styles';
import { contactHref, PLANNER_NOTE, primaryNav, site, socials } from '@/lib/site';

/** Every page ends here, so this is the site's closing call to action. */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="theme-ember border-t border-border">
      {/* Extra bottom padding keeps the last row clear of the fixed assistant button. */}
      <div className="container-page pb-24 pt-[calc(var(--section)*0.8)]">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <p className="text-h2 font-medium text-balance lg:col-span-8">Tell me what you’re building.</p>
          <div className="lg:col-span-4 lg:w-64 lg:justify-self-end">
            <div className="flex flex-wrap gap-3 lg:flex-col">
              <OpenChatButton mode="discovery" className={buttonClasses('accent', 'lg')}>
                Plan your project
              </OpenChatButton>
              <a href={contactHref} target="_blank" rel="noopener noreferrer" className={buttonClasses('secondary', 'lg')}>
                Message me on LinkedIn
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-200 group-hover/button:-translate-y-0.5 group-hover/button:translate-x-0.5"
                  strokeWidth={1.75}
                />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
            <p className="mt-4 max-w-[22rem] text-body-sm text-muted-foreground">
              {PLANNER_NOTE}
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-10 border-t border-border pt-10 sm:grid-cols-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="font-semibold">{site.name}</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              {site.role} with a background in civil engineering.
            </p>
          </div>

          <nav aria-label="Footer" className="lg:col-span-3">
            <ul className="space-y-3 text-caption font-medium">
              <li>
                <Link href="/" className="text-foreground underline-offset-[0.4em] hover:underline hover:decoration-signal">
                  Home
                </Link>
              </li>
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-foreground underline-offset-[0.4em] hover:underline hover:decoration-signal">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="space-y-3 text-caption font-medium lg:col-span-3">
            {socials.map((social) => (
              <li key={social.href}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-foreground underline-offset-[0.4em] hover:underline hover:decoration-signal"
                >
                  {social.label}
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="label mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 text-dim">
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
