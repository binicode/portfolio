import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { getProject, getProjects, projectYear } from '@/lib/projects';
import { parseCaseStudy } from '@/lib/case-study';
import { clientEnv } from '@/lib/config';
import { site } from '@/lib/site';
import { displayFont } from '@/lib/display-font';
import { previewForProject } from '@/lib/systems';
import JsonLdScript from '@/components/site/JsonLd';
import { ArrowLong, ArrowOut } from '@/components/ui/Arrow';
import Plate, { plateNumber } from '@/components/work/Plate';
import StackWindow from '@/components/work/StackWindow';
import ProjectCta from '@/components/work/ProjectCta';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export const viewport: Viewport = {
  themeColor: '#ebebe9',
  colorScheme: 'light',
};

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
    <a href={href} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5 font-medium">
      {children}
      <ArrowOut className="size-3.5" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

// Titles longer than this step down from poster size (as on the work page).
const LONG_TITLE = 12;

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const [project, { projects }] = await Promise.all([getProject(slug), getProjects()]);

  const blocks = project.caseStudyBody ? parseCaseStudy(project.caseStudyBody) : [];
  const index = Math.max(0, projects.findIndex((p) => p.slug === project.slug));
  const nextIndex = (index + 1) % Math.max(1, projects.length);
  const next = projects.length > 1 ? projects[nextIndex] : null;
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
    <div className={`canvas-page ${displayFont.variable}`}>
      <article>
        <JsonLdScript data={jsonLd} />

        <div className="container-page pt-[clamp(1rem,2.5vw,2rem)]">
          <Link
            href="/projects"
            className="group inline-flex items-center gap-3 py-2 text-body-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLong className="h-4 w-8 rotate-180 transition-transform duration-300 ease-[var(--ease-out)] group-hover:-translate-x-1" />
            All work
          </Link>
        </div>

        {/* The same plate as on the work page: title and window carry across the navigation. */}
        <Plate
          id="case-study"
          number={index + 1}
          title={project.title}
          titleAs="h1"
          long={project.title.length > LONG_TITLE}
          transition={project.slug}
          preview={previewForProject(project)}
          fallback={<StackWindow techStack={project.techStack} />}
          caption={<p className="max-w-[42rem] text-lead text-muted-foreground">{project.summary}</p>}
        />

        <div className="container-page mt-[clamp(3.5rem,8vw,6.5rem)]">
          <div className="grid gap-12 border-t border-border pt-10 lg:grid-cols-12 lg:gap-8">
            <aside className="lg:col-span-3">
              <div className="lg:sticky lg:top-8">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-6 text-body-sm lg:grid-cols-1">
                  <div>
                    <dt className="text-muted-foreground">Year</dt>
                    <dd className="mt-1 font-medium tabular-nums">{projectYear(project)}</dd>
                  </div>
                  {project.techStack.length > 0 && (
                    <div className="col-span-2 lg:col-span-1">
                      <dt className="text-muted-foreground">Built with</dt>
                      <dd className="mt-1">
                        <ul className="space-y-0.5 font-medium">
                          {project.techStack.map((tech) => (
                            <li key={tech}>{tech}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                  {(project.liveUrl || project.repoUrl) && (
                    <div className="col-span-2 lg:col-span-1">
                      <dt className="text-muted-foreground">Links</dt>
                      <dd className="mt-1 flex flex-wrap gap-x-5 gap-y-1 lg:flex-col">
                        {project.liveUrl && <ExternalLink href={project.liveUrl}>Live site</ExternalLink>}
                        {project.repoUrl && <ExternalLink href={project.repoUrl}>Source code</ExternalLink>}
                      </dd>
                    </div>
                  )}
                </dl>
                {/* Desktop: beside the write-up, sticky with the facts. Phones get it after the write-up. */}
                <ProjectCta
                  title={project.title}
                  techStack={project.techStack}
                  className="mt-8 hidden border-t border-border pt-6 lg:block"
                />
              </div>
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
                <p className="max-w-[36rem] text-muted-foreground">Full write-up coming soon.</p>
              )}
              <ProjectCta
                title={project.title}
                techStack={project.techStack}
                className="mt-12 border-t border-border pt-8 lg:hidden"
              />
            </div>
          </div>
        </div>

        {/* The reference's foot row, at the end of the read: the next plate's numeral, its name, the arrow. */}
        {next && (
          <nav aria-label="Next project" className="container-page pb-[clamp(5rem,10vw,8rem)] pt-[clamp(5rem,12vw,10rem)]">
            <Link
              href={`/projects/${next.slug}`}
              className="group grid grid-cols-[auto_1fr_auto] items-end gap-x-6 border-t border-border pt-8 sm:gap-x-10"
            >
              <span className="text-numeral font-light text-muted-foreground tabular-nums">{plateNumber(nextIndex + 1)}</span>
              <span className="min-w-0">
                <span className="block text-body-sm text-muted-foreground">Next project</span>
                <span className="mt-2 block font-display text-[clamp(2rem,1.2rem+3.4vw,4.5rem)] leading-[1.02] tracking-[-0.015em] transition-colors duration-200 group-hover:text-accent">
                  {next.title}
                </span>
              </span>
              <span aria-hidden="true" className="plate-arrow">
                <ArrowLong className="h-7 w-14" />
              </span>
            </Link>
          </nav>
        )}
      </article>
    </div>
  );
}
