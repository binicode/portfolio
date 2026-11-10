import Link from 'next/link';
import { ViewTransition } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Project } from '@/types/project';
import { projectYear } from '@/lib/projects';
import ProjectPlate from './ProjectPlate';

interface ProjectLedgerProps {
  projects: Project[];
  headingLevel?: 'h2' | 'h3';
}

/**
 * Projects as editorial rows: a drawing plate, then year, title, summary
 * and stack. Each row is one link. The plate and title share
 * view-transition names with the case study, so both carry across the
 * navigation. `projects` must be in the site-wide (newest-first) order so
 * each project keeps the same plate everywhere.
 */
export default function ProjectLedger({ projects, headingLevel = 'h3' }: ProjectLedgerProps) {
  const Heading = headingLevel;

  return (
    <ol className="border-b border-border">
      {projects.map((project, index) => (
        <li key={project._id}>
          <Link
            href={`/projects/${project.slug}`}
            className="group grid gap-6 border-t border-border py-8 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-8 lg:grid-cols-12 lg:py-10"
          >
            <ViewTransition name={`project-plate-${project.slug}`}>
              <div className="overflow-hidden rounded-md border border-border bg-card lg:col-span-4">
                <ProjectPlate
                  variant={index}
                  className="p-4 transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.035]"
                />
              </div>
            </ViewTransition>

            <div className="flex flex-col lg:col-span-8 lg:pl-4">
              <p className="label text-accent">{projectYear(project)}</p>
              <ViewTransition name={`project-title-${project.slug}`}>
                <Heading className="mt-2 w-fit text-title font-medium transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1.5">
                  {project.title}
                </Heading>
              </ViewTransition>
              <p className="mt-3 max-w-[40rem] text-muted-foreground">{project.summary}</p>

              <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6">
                {project.techStack.length > 0 && (
                  <p className="label max-w-[32rem] leading-relaxed text-muted-foreground">
                    <span className="sr-only">Built with </span>
                    {project.techStack.join(', ')}
                  </p>
                )}
                <span className="label inline-flex items-center gap-1.5 text-foreground transition-colors duration-200 group-hover:text-accent">
                  View project
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-300 ease-[var(--ease-out)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    strokeWidth={1.5}
                  />
                </span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
