import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getProjects } from '@/lib/projects';
import { getGithubActivity } from '@/lib/github-activity';
import { clientEnv } from '@/lib/config';
import { site, socials } from '@/lib/site';
import ProjectShowcase from '@/components/work/ProjectShowcase';
import DashboardPoster from '@/components/saas/DashboardPoster';
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
      jobTitle: site.role,
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
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
          <h2 id="work-title" className="text-h2 font-medium lg:col-span-7">
            Selected work
          </h2>
          <div className="lg:col-span-5">
            <p className="max-w-[30rem] text-muted-foreground">Shipped products, each with a case study.</p>
            <Link href="/projects" className="link mt-4 inline-block text-body-sm font-medium">
              {projects.length > FEATURED_COUNT ? `See all ${projects.length} projects` : 'See all work'}
            </Link>
          </div>
        </div>

        <div className="mt-10 lg:mt-14">
          <ProjectShowcase projects={projects.slice(0, FEATURED_COUNT)} />
        </div>
      </div>
    </section>
  );
}

function Systems({ id }: { id: string }) {
  return (
    <section id={id} aria-labelledby="systems-title" className="overflow-hidden border-y border-border">
      <div className="container-page py-section">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <h2 id="systems-title" className="text-h2 font-medium">
              Try before you hire.
            </h2>
            <p className="mt-5 max-w-[28rem] text-muted-foreground">Three live products, built end to end.</p>
          </div>
          <DashboardPoster className="reveal lg:col-span-7" />
        </div>

        <ul className="mt-16 grid gap-px border-y border-border bg-border lg:mt-24 lg:grid-cols-3">
          {LIVE_SYSTEMS.map((system) => (
            <li key={system.name} className="flex flex-col bg-background py-8 lg:px-8 lg:first:pl-0 lg:last:pr-0">
              <h3 className="text-h3 font-semibold">{system.name}</h3>
              <p className="mt-3 flex-1 text-body-sm leading-relaxed text-muted-foreground">{system.body}</p>
              <div className="mt-6">
                {system.action.kind === 'chat' ? (
                  <OpenChatButton mode="chat" className="link text-body-sm font-medium">
                    {system.action.label}
                  </OpenChatButton>
                ) : (
                  <Link href={system.action.href} className="link text-body-sm font-medium">
                    {system.action.label}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function About() {
  // Plain facts, no figures: the statement is the section's one peak.
  const facts = [
    {
      label: 'Live products',
      detail: (
        <>
          <OpenChatButton mode="chat" className="link text-left">
            AI assistant
          </OpenChatButton>
          ,{' '}
          <Link href="/saas" className="link">
            SaaS dashboard
          </Link>
          ,{' '}
          <Link href="/shop" className="link">
            Shopify store
          </Link>
        </>
      ),
    },
    { label: 'Certificates', detail: 'Meta Front-End, IBM Back-End' },
    { label: 'One engineer', detail: 'Interface, API, database. No handoffs.' },
  ];

  return (
    <section id="about" aria-labelledby="about-title" className="py-section">
      <div className="container-page">
        <p className="label text-signal">About</p>
        <h2 id="about-title" className="mt-5 max-w-[22ch] text-h2 font-medium">
          <RevealWords text="Trained to build things that must not fail." emphasis="must not fail" />
        </h2>

        <dl className="mt-14 grid gap-8 sm:grid-cols-3 sm:gap-6 lg:mt-20">
          {facts.map((fact) => (
            <div key={fact.label} className="border-l border-border pl-5">
              <dt className="label text-muted-foreground">{fact.label}</dt>
              <dd className="mt-3 max-w-[22rem] text-body-lg">{fact.detail}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 grid gap-10 border-t border-border pt-12 lg:mt-24 lg:grid-cols-12 lg:gap-8">
          <p className="label text-muted-foreground lg:col-span-4">Background</p>
          <div className="space-y-4 lg:col-span-7 lg:col-start-6">
            <p className="text-lead">Freelance, based in Addis Ababa (UTC+3), working with clients worldwide.</p>
            <p className="text-muted-foreground">Next.js, TypeScript, Node.js, Express, MongoDB.</p>
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
            className="mt-3 inline-flex items-center gap-1 text-body-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            github.com/{site.githubUsername}
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
          </a>
        </div>
        <ol className="border-t border-border lg:col-span-7 lg:col-start-6">
          {activity.map((item) => (
            <li key={item.id} className="grid grid-cols-[4.5rem_1fr] gap-4 border-b border-border py-3.5 text-body-sm">
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
