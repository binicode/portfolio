import Link from 'next/link';
import { ViewTransition } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Project } from '@/types/project';
import { projectYear } from '@/lib/projects';

interface ProjectLedgerProps {
  projects: Project[];
  headingLevel?: 'h2' | 'h3';
}

/**
 * Projects as a ledger: year, title and summary, stack. Each row is one
 * link. The title shares a view-transition name with the case-study
 * heading, so it carries across the navigation.
 */
export default function ProjectLedger({ projects, headingLevel = 'h3' }: ProjectLedgerProps) {
  const Heading = headingLevel;

  return (
    <ol className="border-b border-border">
      {projects.map((project) => (
        <li key={project._id}>
          <Link
            href={`/projects/${project.slug}`}
            className="group grid grid-cols-[3.5rem_1fr] gap-x-4 gap-y-3 border-t border-border py-7 transition-colors duration-300 sm:grid-cols-[5rem_1fr] lg:grid-cols-12 lg:gap-x-8 lg:py-9"
          >
            <span className="pt-1 text-sm tabular-nums text-muted-foreground lg:col-span-1">
              {projectYear(project)}
            </span>

            <div className="lg:col-span-6">
              <ViewTransition name={`project-title-${project.slug}`}>
                <Heading className="w-fit font-semiwide text-title font-semibold transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1.5">
                  {project.title}
                </Heading>
              </ViewTransition>
              <p className="mt-3 max-w-[38rem] text-muted-foreground">{project.summary}</p>
            </div>

            {project.techStack.length > 0 && (
              <p className="col-start-2 text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-foreground lg:col-span-4 lg:col-start-auto lg:pt-2">
                <span className="sr-only">Built with </span>
                {project.techStack.join(', ')}
              </p>
            )}

            <span aria-hidden="true" className="hidden justify-end pt-2 lg:col-span-1 lg:col-start-12 lg:flex">
              <ArrowUpRight
                className="h-5 w-5 -translate-x-1 translate-y-1 opacity-0 transition-[opacity,transform] duration-300 ease-[var(--ease-out)] group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                strokeWidth={1.5}
              />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
