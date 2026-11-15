import Link from 'next/link';
import { ArrowOut } from '@/components/ui/Arrow';
import { primaryNav, site, socials } from '@/lib/site';

/**
 * A quiet last line, in the page's own material. The closing call to action
 * belongs to each page: the portfolio pages end on the contact plate, the
 * products on their own "get started" section.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      {/* Extra bottom padding keeps the last row clear of the fixed assistant button. */}
      <div className="container-page grid gap-8 pb-24 pt-10 text-body-sm md:grid-cols-[1fr_auto] md:items-start md:gap-x-12">
        <div>
          <p className="font-semibold">{site.name}</p>
          <p className="mt-1 text-muted-foreground">{site.role}, trained in civil engineering.</p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
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
            {socials.map((social) => (
              <li key={social.href}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {social.label}
                  <ArrowOut className="h-3.5 w-3.5" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground md:col-span-2">
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
