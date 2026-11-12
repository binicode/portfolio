import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getProjects } from '@/lib/projects';
import { getGithubActivity } from '@/lib/github-activity';
import { clientEnv } from '@/lib/config';
import { site, socials } from '@/lib/site';
import ProjectLedger from '@/components/work/ProjectLedger';
import DashboardPreview from '@/components/saas/DashboardPreview';
import PointerLight from '@/components/effects/PointerLight';
import OpenChatButton from '@/components/chat/OpenChatButton';
import JsonLdScript from '@/components/site/JsonLd';
import HeroSystem from '@/components/home/HeroSystem';
import RevealWords from '@/components/ui/RevealWords';
import { LIVE_SYSTEMS } from '@/lib/systems';
import type { Project } from '@/types/project';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
};

const FEATURED_COUNT = 4;

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

function SelectedWork({ projects }: { projects: Project[] }) {
  return (
    <section id="work" aria-labelledby="work-title" className="py-section">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="work-title" className="text-h2 font-medium">
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
          <ProjectLedger projects={projects.slice(0, FEATURED_COUNT)} />
        </div>
      </div>
    </section>
  );
}

function Systems({ id }: { id: string }) {
  return (
    <section id={id} aria-labelledby="systems-title" className="theme-ink overflow-hidden">
      <PointerLight>
        <div className="container-page py-section">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5">
              <h2 id="systems-title" className="text-h2 font-medium">
                Working systems, not mockups
              </h2>
              <p className="mt-5 max-w-[28rem] text-muted-foreground">
                Three products run on this site, each with its own backend. Try them while you read.
              </p>
            </div>
            <DashboardPreview compact className="reveal lg:col-span-7" />
          </div>

          <ul className="mt-16 grid gap-px border-y border-border bg-border lg:mt-24 lg:grid-cols-3">
            {LIVE_SYSTEMS.map((system) => (
              <li key={system.name} className="flex flex-col bg-background py-8 lg:px-8 lg:first:pl-0 lg:last:pr-0">
                <h3 className="text-h3 font-semibold">{system.name}</h3>
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
  // Big numbers with small mono labels, in the reference's hierarchy. All three are plain facts.
  const stats = [
    {
      value: '3',
      label: 'Products running on this site',
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
    {
      value: '2',
      label: 'Professional certificates',
      detail: 'Meta Front-End Developer, IBM JavaScript Back-End Developer',
    },
    {
      value: '1',
      label: 'Engineer, end to end',
      detail: 'Interface, API and database, with a civil engineering background',
    },
  ];

  return (
    <section id="about" aria-labelledby="about-title" className="py-section">
      <div className="container-page">
        <h2 id="about-title" className="label text-accent">
          From structures to software
        </h2>
        <p className="mt-6 max-w-[32ch] text-statement font-medium">
          <RevealWords text="A civil engineer’s discipline, applied to software: systems that are planned, measured and built to keep working." />
        </p>

        <dl className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-6 lg:mt-24">
          {stats.map((stat) => (
            <div key={stat.label} className="border-l border-border pl-5">
              <dt className="label text-muted-foreground">{stat.label}</dt>
              <dd className="mt-5 text-stat font-normal tabular-nums">{stat.value}</dd>
              <dd className="mt-5 max-w-[22rem] text-[0.9375rem] leading-relaxed text-muted-foreground">{stat.detail}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 grid gap-10 border-t border-border pt-12 lg:mt-24 lg:grid-cols-12 lg:gap-8">
          <p className="label text-muted-foreground lg:col-span-4">Background</p>
          <div className="space-y-6 lg:col-span-7 lg:col-start-6">
            <p className="text-lead">
              I am a full-stack software engineer with a background in civil engineering, combining engineering
              discipline, systems thinking and modern software development to build reliable digital products.
            </p>
            <p className="text-muted-foreground">
              Certified through the Meta Front-End Developer and IBM JavaScript Back-End Developer professional
              certificates, I build end-to-end applications with Next.js, TypeScript, Node.js, Express and MongoDB,
              from polished user interfaces and modular REST APIs to secure, scalable backend systems.
            </p>
            <p className="text-muted-foreground">
              I care about more than making software work. I focus on clean, resilient, maintainable and
              high-performance systems, with thoughtful architecture, responsive experiences and real-world usability.
            </p>
          </div>
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
          <h2 id="activity-title" className="text-h3 font-semibold">
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
              <time dateTime={item.createdAt} className="label pt-1 text-muted-foreground">
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

export default async function HomePage() {
  // A home page shouldn't advertise an empty list: with no published case
  // studies (or the API down), the live systems take the work slot instead.
  const { projects } = await getProjects();
  const hasProjects = projects.length > 0;

  return (
    <>
      <JsonLd />
      <HeroSystem />
      {hasProjects && <SelectedWork projects={projects} />}
      <Systems id={hasProjects ? 'systems' : 'work'} />
      <About />
      <Activity />
    </>
  );
}
