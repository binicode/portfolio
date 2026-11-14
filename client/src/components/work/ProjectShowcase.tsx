import Link from 'next/link';
import { ViewTransition } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Project } from '@/types/project';
import { projectYear } from '@/lib/projects';
import StackMap from './StackMap';

type HeadingLevel = 'h2' | 'h3';

/**
 * The project title is the card's one primary link, stretched over the whole
 * card (::after); the external links sit above it (z-10) so they stay
 * separately clickable and focusable.
 */
function TitleLink({ project, as: Heading, className }: { project: Project; as: HeadingLevel; className: string }) {
  return (
    <ViewTransition name={`project-title-${project.slug}`}>
      <Heading className={`w-fit ${className}`}>
        <Link
          href={`/projects/${project.slug}`}
          // The ring is drawn inside the card: the card clips anything outside its edge.
          className="after:absolute after:inset-0 after:z-[1] after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-4 focus-visible:after:outline-ring"
        >
          {project.title}
        </Link>
      </Heading>
    </ViewTransition>
  );
}

function ExternalLinks({ project }: { project: Project }) {
  const links = [
    project.liveUrl && { href: project.liveUrl, label: 'Live site' },
    project.repoUrl && { href: project.repoUrl, label: 'Source' },
  ].filter(Boolean) as Array<{ href: string; label: string }>;
  if (links.length === 0) return null;
  return (
    <span className="relative z-10 flex items-center gap-4">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {link.label}
          <ArrowUpRight aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
          <span className="sr-only"> for {project.title} (opens in a new tab)</span>
        </a>
      ))}
    </span>
  );
}

/** The cue that the whole card opens the case study (the title link does the work). */
function CaseStudyCue({ strong = false }: { strong?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
        strong ? 'text-accent-bright' : 'text-foreground group-hover:text-accent-bright'
      }`}
    >
      Case study
      <ArrowRight className="size-4 transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1" strokeWidth={1.75} />
    </span>
  );
}

function Featured({ project, heading }: { project: Project; heading: HeadingLevel }) {
  return (
    <article className="work-card group relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-8 lg:p-10">
      <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-10">
        <div className="lg:col-span-7">
          <p className="label flex items-center gap-3">
            <span className="text-accent-bright">Featured</span>
            <span aria-hidden="true" className="h-px w-6 bg-border" />
            <span className="text-muted-foreground">{projectYear(project)}</span>
          </p>
          <TitleLink
            project={project}
            as={heading}
            className="mt-4 text-h2 font-medium"
          />
        </div>
        <div className="lg:col-span-5">
          <p className="max-w-[34rem] text-body-lg leading-relaxed text-muted-foreground">{project.summary}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <CaseStudyCue strong />
            <ExternalLinks project={project} />
          </div>
        </div>
      </div>
      {/* The architecture runs the full width of the card, left to right. */}
      <ViewTransition name={`project-plate-${project.slug}`}>
        <StackMap techStack={project.techStack} layout="flow" className="mt-8 lg:mt-10" />
      </ViewTransition>
    </article>
  );
}

function Compact({ project, heading }: { project: Project; heading: HeadingLevel }) {
  return (
    <article className="work-card group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5">
      <ViewTransition name={`project-plate-${project.slug}`}>
        {/* A shared minimum height keeps titles on one line across a row, whatever the layer count. */}
        <StackMap techStack={project.techStack} className="min-h-[9.25rem]" />
      </ViewTransition>
      <p className="label mt-5 text-muted-foreground">{projectYear(project)}</p>
      <TitleLink project={project} as={heading} className="mt-2 text-h3 font-medium" />
      <p className="mt-2 line-clamp-3 text-body-sm leading-relaxed text-muted-foreground">{project.summary}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-5">
        <CaseStudyCue />
        <ExternalLinks project={project} />
      </div>
    </article>
  );
}

/**
 * Projects as a composed showcase rather than identical rows: the newest as
 * a wide feature (story on the left, its architecture flowing across the
 * right), the rest as compact cards, two or three to a row. Each card shows
 * the project as the system it is (`StackMap`), and the title and map share
 * view-transition names with the case study, so both carry across the
 * navigation. `projects` must be in the site-wide newest-first order.
 */
export default function ProjectShowcase({ projects, headingLevel = 'h3' }: { projects: Project[]; headingLevel?: HeadingLevel }) {
  const [featured, ...rest] = projects;
  if (!featured) return null;
  // With an odd count at two columns, the last card takes the full row.
  const lastSpans = rest.length % 2 === 1;

  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
      <li className="md:col-span-2 lg:col-span-3">
        <Featured project={featured} heading={headingLevel} />
      </li>
      {rest.map((project, index) => (
        <li key={project._id} className={lastSpans && index === rest.length - 1 ? 'md:col-span-2 lg:col-span-1' : ''}>
          <Compact project={project} heading={headingLevel} />
        </li>
      ))}
    </ol>
  );
}
