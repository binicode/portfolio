import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import OpenChatButton from '@/components/chat/OpenChatButton';
import { contactHref, primaryNav, site, socials } from '@/lib/site';

interface SiteFooterProps {
  /** False where the assistant isn't mounted (the root 404), so no dead button shows. */
  assistant?: boolean;
}

export default function SiteFooter({ assistant = true }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="theme-ink footer-glow">
      {/* Extra bottom padding keeps the last row clear of the fixed assistant button. */}
      <div className="container-page pb-24 pt-[calc(var(--section)*0.8)]">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <p className="text-h1 font-medium text-balance lg:col-span-8">Have something that needs to hold up?</p>
          <div className="flex flex-wrap gap-3 lg:col-span-4 lg:w-64 lg:flex-col lg:justify-self-end">
            {assistant && (
              <OpenChatButton
                mode="discovery"
                className="inline-flex h-12 items-center justify-center rounded-xs bg-primary px-6 font-mono text-xs uppercase tracking-[0.04em] text-primary-foreground transition-colors duration-200 hover:bg-primary/85"
              >
                Plan your project
              </OpenChatButton>
            )}
            <a
              href={contactHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`group inline-flex h-12 items-center justify-center gap-2 rounded-xs px-6 font-mono text-xs uppercase tracking-[0.04em] transition-colors duration-200 ${
                assistant
                  ? 'border border-border text-foreground hover:border-foreground/50'
                  : 'bg-primary text-primary-foreground hover:bg-primary/85'
              }`}
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
            <p className="font-semibold">{site.name}</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              {site.role} with a background in civil engineering.
            </p>
          </div>

          <nav aria-label="Footer" className="lg:col-span-3">
            <ul className="label space-y-3">
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

          <ul className="label space-y-3 lg:col-span-3">
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
