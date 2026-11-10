import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getProjects } from '@/lib/projects';
import { getGithubActivity } from '@/lib/github-activity';
import { clientEnv } from '@/lib/config';
import { site, socials } from '@/lib/site';
import ButtonLink from '@/components/ui/ButtonLink';
import ProjectLedger from '@/components/work/ProjectLedger';
import DashboardPreview from '@/components/saas/DashboardPreview';
import PointerLight from '@/components/effects/PointerLight';
import OpenChatButton from '@/components/chat/OpenChatButton';
import JsonLdScript from '@/components/site/JsonLd';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
};

const FEATURED_COUNT = 4;

/** Stagger offset for the hero's one load sequence. */
const delay = (ms: number) => ({ '--delay': `${ms}ms` }) as CSSProperties;

function JsonLd() {
  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL;
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
      name: site.name,
      jobTitle: 'Full-Stack Software Engineer',
      description: site.description,
      url: siteUrl,
      knowsAbout: ['Next.js', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'Civil engineering'],
      hasCredential: [
        { '@type': 'EducationalOccupationalCredential', name: 'Meta Front-End Developer Professional Certificate' },
        { '@type': 'EducationalOccupationalCredential', name: 'IBM JavaScript Back-End Developer Professional Certificate' },
      ],
      sameAs: socials.map((s) => s.href),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: site.name,
      url: siteUrl,
      author: { '@id': `${siteUrl}/#person` },
    },
  ];
  return <JsonLdScript data={data} />;
}

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="container-page h-full">
          <div className="column-guides h-full border-x border-[rgb(15_34_51/0.045)]" />
        </div>
      </div>

      <div className="container-page relative pb-14 pt-[clamp(3rem,8vw,7.5rem)] lg:pb-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <h1 id="hero-title" className="lg:col-span-8">
            <span className="block text-base text-muted-foreground sm:text-lead">
              {site.name}, full‑stack software engineer
            </span>{' '}
            <span className="mt-5 block max-w-[12ch] font-wide text-display font-semibold sm:mt-7">
              Software engineered to hold up.
            </span>
          </h1>

          <div className="max-w-[34rem] lg:col-span-4 lg:pb-2">
            <p className="text-[1.0625rem] leading-relaxed">
              I build web applications and SaaS products end to end, from the interface to the API to the database. A
              background in civil engineering shapes how I work: engineering discipline, systems thinking, and software
              that stays reliable in real use.
            </p>
            <div className="motion-rise mt-8 flex flex-wrap gap-3" style={delay(200)}>
              <ButtonLink href="#work">See selected work</ButtonLink>
              <ButtonLink href="/saas" variant="secondary">
                Explore the SaaS
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="dimension mt-12 text-[0.8125rem] sm:mt-16">
          <span className="dimension__line motion-draw" style={delay(150)} />
          <span className="shrink-0">Civil engineering to software engineering</span>
          <span className="dimension__line dimension__line--end motion-draw" style={delay(150)} />
        </div>

        <dl
          className="motion-rise mt-10 grid grid-cols-1 gap-px border-y border-foreground/80 bg-border sm:grid-cols-2 lg:mt-12 lg:grid-cols-4"
          style={delay(300)}
        >
          {[
            {
              term: 'Discipline',
              detail: 'Full-stack software engineering, with a civil engineering background',
            },
            { term: 'Core stack', detail: 'Next.js, TypeScript, Node.js, Express, MongoDB' },
            {
              term: 'Certifications',
              detail: (
                <>
                  Meta Front-End Developer
                  <br />
                  IBM JavaScript Back-End Developer
                </>
              ),
            },
            {
              term: 'Running on this site',
              detail: (
                <>
                  <OpenChatButton className="link text-left">AI assistant</OpenChatButton>,{' '}
                  <Link href="/saas" className="link">
                    SaaS dashboard
                  </Link>
                  ,{' '}
                  <Link href="/shop" className="link">
                    Shopify storefront
                  </Link>
                </>
              ),
            },
          ].map((cell) => (
            <div
              key={cell.term}
              className="bg-background py-5 sm:pr-5 sm:even:pl-5 lg:py-6 lg:pl-5 lg:first:pl-0"
            >
              <dt className="text-[0.8125rem] text-muted-foreground">{cell.term}</dt>
              <dd className="mt-2 text-[0.9375rem] font-medium leading-snug">{cell.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

async function SelectedWork() {
  const { projects, unavailable } = await getProjects();

  return (
    <section id="work" aria-labelledby="work-title" className="py-section">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="work-title" className="font-wide text-h2 font-semibold">
              Selected work
            </h2>
            <p className="mt-4 max-w-[30rem] text-muted-foreground">
              Products I designed and built, with notes on the decisions behind them.
            </p>
          </div>
          {projects.length > FEATURED_COUNT && (
            <Link href="/projects" className="link text-[0.9375rem] font-medium">
              All {projects.length} projects
            </Link>
          )}
        </div>

        <div className="mt-12 lg:mt-16">
          {projects.length > 0 ? (
            <ProjectLedger projects={projects.slice(0, FEATURED_COUNT)} />
          ) : (
            <p className="border-y border-border py-10 text-muted-foreground">
              {unavailable
                ? 'Projects can’t be loaded right now. Refresh in a minute, or ask the assistant about my work.'
                : 'Case studies are being written up and will appear here soon.'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

const SYSTEMS = [
  {
    name: 'Portfolio assistant',
    body: 'Retrieval-augmented chat. Questions are matched against my notes with Voyage AI embeddings and MongoDB Atlas Vector Search, then Gemini streams the answer with its sources.',
    action: { kind: 'chat' as const, label: 'Ask the assistant' },
  },
  {
    name: 'Creator Dashboard',
    body: 'A paid SaaS product: accounts, Stripe Checkout subscriptions with verified webhooks, and one dashboard for GitHub, YouTube and Hacker News numbers.',
    action: { kind: 'link' as const, label: 'See the product', href: '/saas' },
  },
  {
    name: 'Headless storefront',
    body: 'Products come from the Shopify Storefront API and are rendered on the server. Checkout is handed to Shopify.',
    action: { kind: 'link' as const, label: 'Visit the shop', href: '/shop' },
  },
];

function Systems() {
  return (
    <section aria-labelledby="systems-title" className="theme-ink overflow-hidden">
      <PointerLight>
        <div className="container-page py-section">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5">
              <h2 id="systems-title" className="font-wide text-h2 font-semibold">
                Working systems, not mockups
              </h2>
              <p className="mt-5 max-w-[28rem] text-muted-foreground">
                Three products run on this site, each with its own backend. Try them while you read.
              </p>
            </div>
            <DashboardPreview className="reveal lg:col-span-7" />
          </div>

          <ul className="mt-16 grid gap-px border-y border-border bg-border lg:mt-24 lg:grid-cols-3">
            {SYSTEMS.map((system) => (
              <li key={system.name} className="flex flex-col bg-background py-8 lg:px-8 lg:first:pl-0 lg:last:pr-0">
                <h3 className="font-semiwide text-h3 font-semibold">{system.name}</h3>
                <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted-foreground">{system.body}</p>
                <div className="mt-6">
                  {system.action.kind === 'chat' ? (
                    <OpenChatButton className="link text-[0.9375rem] font-medium">{system.action.label}</OpenChatButton>
                  ) : (
                    <Link href={system.action.href} className="link text-[0.9375rem] font-medium">
                      {system.action.label}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </PointerLight>
    </section>
  );
}

function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="py-section">
      <div className="container-page grid gap-10 lg:grid-cols-12 lg:gap-8">
        <h2 id="about-title" className="font-wide text-h2 font-semibold lg:col-span-4">
          From structures to software
        </h2>
        <div className="space-y-6 lg:col-span-7 lg:col-start-6">
          <p className="text-lead">
            I am a full-stack software engineer with a background in civil engineering, combining engineering discipline,
            systems thinking and modern software development to build reliable digital products.
          </p>
          <p className="text-muted-foreground">
            Certified through the Meta Front-End Developer and IBM JavaScript Back-End Developer professional
            certificates, I build end-to-end applications with Next.js, TypeScript, Node.js, Express and MongoDB, from
            polished user interfaces and modular REST APIs to secure, scalable backend systems.
          </p>
          <p className="text-muted-foreground">
            I care about more than making software work. I focus on clean, resilient, maintainable and high-performance
            systems, with thoughtful architecture, responsive experiences and real-world usability.
          </p>
        </div>
      </div>
    </section>
  );
}

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

async function Activity() {
  const activity = await getGithubActivity(site.githubUsername);
  if (activity.length === 0) return null;

  return (
    <section aria-labelledby="activity-title" className="pb-section">
      <div className="container-page grid gap-8 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <h2 id="activity-title" className="font-semiwide text-h3 font-semibold">
            Recently on GitHub
          </h2>
          <a
            href={`https://github.com/${site.githubUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-[0.9375rem] text-muted-foreground transition-colors hover:text-foreground"
          >
            github.com/{site.githubUsername}
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
          </a>
        </div>
        <ol className="border-t border-border lg:col-span-7 lg:col-start-6">
          {activity.map((item) => (
            <li key={item.id} className="grid grid-cols-[4.5rem_1fr] gap-4 border-b border-border py-3.5 text-[0.9375rem]">
              <time dateTime={item.createdAt} className="tabular-nums text-muted-foreground">
                {dateFormat.format(new Date(item.createdAt))}
              </time>
              <span className="min-w-0 break-words">{item.summary}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <Hero />
      <SelectedWork />
      <Systems />
      <About />
      <Activity />
    </>
  );
}
