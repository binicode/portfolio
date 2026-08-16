import Link from 'next/link';
import type { Project } from '@/types/project';

interface FeaturedProjectsProps {
  projects: Project[];
}

export default function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  if (projects.length === 0) {
    return null;
  }

  const [primary, ...rest] = projects;
  const secondary = rest.slice(0, 2);

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Featured Work</h2>
        <Link href="/projects" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Link
          href={`/projects/${primary.slug}`}
          className="group rounded-2xl border border-border bg-card p-8 shadow-lg shadow-black/20 transition-transform duration-300 hover:scale-[1.01]"
        >
          <h3 className="text-xl font-semibold text-foreground">{primary.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{primary.summary}</p>
          {primary.techStack.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {primary.techStack.map((tech) => (
                <span key={tech} className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </Link>

        <div className="flex flex-col gap-6">
          {secondary.map((project) => (
            <Link
              key={project._id}
              href={`/projects/${project.slug}`}
              className="group flex-1 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/20 transition-transform duration-300 hover:scale-[1.01]"
            >
              <h3 className="font-semibold text-foreground">{project.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
