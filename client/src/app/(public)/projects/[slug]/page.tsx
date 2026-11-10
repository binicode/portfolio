import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ViewTransition } from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { getProject, getProjects, projectYear } from '@/lib/projects';
import { parseCaseStudy } from '@/lib/case-study';
import { clientEnv } from '@/lib/config';
import { site } from '@/lib/site';
import JsonLdScript from '@/components/site/JsonLd';
import ProjectPlate from '@/components/work/ProjectPlate';


interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { projects } = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  const path = `/projects/${project.slug}`;

  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      url: path,
      title: project.title,
      description: project.summary,
      publishedTime: project.createdAt,
      modifiedTime: project.updatedAt,
      authors: [site.name],
    },
  };
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium transition-colors hover:text-accent"
    >
      {children}
      <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const [project, { projects }] = await Promise.all([getProject(slug), getProjects()]);

  const blocks = project.caseStudyBody ? parseCaseStudy(project.caseStudyBody) : [];
  const index = projects.findIndex((p) => p.slug === project.slug);
  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : null;
  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    headline: project.title,
    description: project.summary,
    url: `${siteUrl}/projects/${project.slug}`,
    dateCreated: project.createdAt,
    dateModified: project.updatedAt,
    keywords: project.techStack.join(', '),
    author: { '@type': 'Person', '@id': `${siteUrl}/#person`, name: site.name },
    ...(project.liveUrl ? { sameAs: project.liveUrl } : {}),
  };

  return (
    <article className="pb-section">
      <JsonLdScript data={jsonLd} />

      <header className="container-page pt-[clamp(2rem,5vw,4.5rem)]">
        <Link
          href="/projects"
          className="label group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
            strokeWidth={1.75}
          />
          All work
        </Link>

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-7">
            <ViewTransition name={`project-title-${project.slug}`}>
              <h1 className="w-fit text-h1 font-medium">{project.title}</h1>
            </ViewTransition>
            <p className="mt-6 max-w-[42rem] text-lead text-muted-foreground">{project.summary}</p>
          </div>
          <ViewTransition name={`project-plate-${project.slug}`}>
            <div className="overflow-hidden rounded-md border border-border bg-card lg:col-span-5">
              {/* Same plate as on the work list (position in the newest-first list). */}
              <ProjectPlate variant={Math.max(index, 0)} className="p-5" />
            </div>
          </ViewTransition>
        </div>
      </header>

      <div className="container-page mt-12 lg:mt-16">
        <div className="grid gap-12 border-t border-foreground/80 pt-10 lg:grid-cols-12 lg:gap-8">
        <aside className="lg:col-span-3">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 text-[0.9375rem] lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:grid-cols-1">
            <div>
              <dt className="label text-muted-foreground">Year</dt>
              <dd className="mt-1 tabular-nums">{projectYear(project)}</dd>
            </div>
            {project.techStack.length > 0 && (
              <div className="col-span-2 lg:col-span-1">
                <dt className="label text-muted-foreground">Built with</dt>
                <dd className="mt-1">
                  <ul className="space-y-0.5">
                    {project.techStack.map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            {(project.liveUrl || project.repoUrl) && (
              <div className="col-span-2 lg:col-span-1">
                <dt className="label text-muted-foreground">Links</dt>
                <dd className="mt-1 flex flex-wrap gap-x-5 gap-y-1 lg:flex-col">
                  {project.liveUrl && <ExternalLink href={project.liveUrl}>Live site</ExternalLink>}
                  {project.repoUrl && <ExternalLink href={project.repoUrl}>Source code</ExternalLink>}
                </dd>
              </div>
            )}
          </dl>
        </aside>

        <div className="lg:col-span-7 lg:col-start-5">
          {blocks.length > 0 ? (
            <div className="case-study">
              {blocks.map((block, i) => {
                if (block.type === 'heading') {
                  const Tag = block.level === 2 ? 'h2' : 'h3';
                  return (
                    <Tag key={i} id={block.id}>
                      {block.text}
                    </Tag>
                  );
                }
                if (block.type === 'list') {
                  return (
                    <ul key={i}>
                      {block.items.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                return <p key={i}>{block.text}</p>;
              })}
            </div>
          ) : (
            <p className="max-w-[36rem] text-muted-foreground">
              The full write-up for this project is in progress. The summary, stack and links above describe what was
              built.
            </p>
          )}
        </div>
        </div>
      </div>

      {next && (
        <nav aria-label="Next project" className="container-page mt-[var(--section)]">
          <Link href={`/projects/${next.slug}`} className="group block border-y border-border py-10 lg:py-14">
            <span className="label text-muted-foreground">Next project</span>
            <span className="mt-3 flex items-end justify-between gap-6">
              <span className="text-h2 font-medium transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1.5">
                {next.title}
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="mb-2 h-7 w-7 shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                strokeWidth={1.5}
              />
            </span>
          </Link>
        </nav>
      )}
    </article>
  );
}
