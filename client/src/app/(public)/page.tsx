import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { getProjects } from '@/lib/projects';
import { getGithubActivity } from '@/lib/github-activity';
import { clientEnv } from '@/lib/config';
import { displayFont } from '@/lib/display-font';
import { site, socials } from '@/lib/site';
import OpenChatButton from '@/components/chat/OpenChatButton';
import JsonLdScript from '@/components/site/JsonLd';
import PillParts, { pillClasses } from '@/components/ui/PillAction';
import { ArrowOut } from '@/components/ui/Arrow';
import LiveSystemPlates from '@/components/work/LiveSystemPlates';
import ContactPlate from '@/components/work/ContactPlate';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
};

export const viewport: Viewport = {
  themeColor: '#ebebe9',
  colorScheme: 'light',
};

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

/** The board's title: the name at poster size, what I do in one sentence, and the way in. */
function Hero() {
  return (
    <section aria-labelledby="hero-title" className="container-page pb-[clamp(1rem,4vw,3rem)] pt-[clamp(3rem,9vw,8rem)] text-center">
      <h1 id="hero-title" className="font-display text-mega">
        {site.name}
      </h1>
      <p className="mx-auto mt-[clamp(1.5rem,3vw,2.5rem)] max-w-[38rem] text-lead text-muted-foreground">
        Full-stack software engineer, trained in civil engineering. I design and build web apps and SaaS products, from
        interface to database.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
        <OpenChatButton mode="discovery" className={pillClasses()}>
          <PillParts>Plan your project</PillParts>
        </OpenChatButton>
        <a href="#work" className="link text-[0.9375rem] font-medium">
          See the work
        </a>
      </div>
      <p className="mt-4 text-body-sm text-muted-foreground">About 2 minutes. You get a project brief to keep.</p>
    </section>
  );
}

function About() {
  // Plain facts, each with its proof.
  const facts = [
    {
      value: '3',
      label: 'Live products',
      detail: (
        <>
          <a href="#assistant" className="link">
            AI assistant
          </a>
          ,{' '}
          <Link href="/saas" className="link">
            SaaS dashboard
          </Link>{' '}
          and{' '}
          <Link href="/shop" className="link">
            Shopify storefront
          </Link>
          , running on this site.
        </>
      ),
    },
    { value: '2', label: 'Certificates', detail: 'Meta Front-End Developer and IBM JavaScript Back-End Developer.' },
    { value: '1', label: 'Engineer, end to end', detail: 'Interface, API and database, by the same hands.' },
  ];

  return (
    <section id="about" aria-labelledby="about-title" className="container-page pt-[clamp(6rem,14vw,12rem)]">
      <h2 id="about-title" className="mx-auto max-w-[15ch] text-center font-display text-poster">
        A civil engineer’s discipline, applied to software.
      </h2>
      <p className="mx-auto mt-7 max-w-[36rem] text-center text-lead text-muted-foreground">
        I trained in civil engineering, where a structure has to carry its load on the first day and every day after. I
        build software the same way, with Next.js, TypeScript, Node.js, Express and MongoDB.
      </p>

      <dl className="mx-auto mt-[clamp(3.5rem,8vw,6.5rem)] grid max-w-[64rem] gap-y-10 border-t border-border pt-10 sm:grid-cols-3 sm:gap-x-10">
        {facts.map((fact) => (
          <div key={fact.label} className="flex flex-col">
            <dt className="order-2 mt-3 font-semibold">{fact.label}</dt>
            <dd className="order-1 text-[clamp(3rem,2rem+3vw,4.5rem)] font-light leading-none tracking-[-0.04em] tabular-nums">
              {fact.value}
            </dd>
            <dd className="order-3 mt-1.5 max-w-[20rem] text-body-sm leading-relaxed text-muted-foreground">{fact.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

async function Activity() {
  const activity = await getGithubActivity(site.githubUsername);
  if (activity.length === 0) return null;

  return (
    <section aria-labelledby="activity-title" className="container-page pt-[clamp(5rem,10vw,8rem)]">
      <div className="mx-auto grid max-w-[64rem] gap-8 md:grid-cols-[1fr_2fr] md:gap-12">
        <div>
          <h2 id="activity-title" className="text-h3 font-semibold">
            Recently on GitHub
          </h2>
          <a
            href={`https://github.com/${site.githubUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-body-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            github.com/{site.githubUsername}
            <ArrowOut className="size-3.5" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
        <ol className="border-t border-border">
          {activity.map((item) => (
            <li key={item.id} className="grid grid-cols-[4.5rem_1fr] gap-4 border-b border-border py-3.5 text-body-sm">
              <time dateTime={item.createdAt} className="text-muted-foreground tabular-nums">
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
  const { projects } = await getProjects();

  return (
    <div className={`canvas-page ${displayFont.variable}`}>
      <JsonLd />
      <Hero />
      <section id="work" aria-label="Work">
        <LiveSystemPlates projects={projects} last={{ href: '/projects', label: 'All work' }} />
      </section>
      <About />
      <Activity />
      <ContactPlate />
    </div>
  );
}
