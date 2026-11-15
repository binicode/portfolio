import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { ArrowOut } from '@/components/ui/Arrow';
import type { Project } from '@/types/project';
import { getProjects } from '@/lib/projects';
import { displayFont } from '@/lib/display-font';
import { previewForProject } from '@/lib/systems';
import Plate from '@/components/work/Plate';
import StackWindow from '@/components/work/StackWindow';
import LiveSystemPlates from '@/components/work/LiveSystemPlates';
import ContactPlate from '@/components/work/ContactPlate';

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Case studies of products Biniyam Abera designed and built: a subscription SaaS with Stripe billing, a retrieval-augmented AI assistant, a headless Shopify storefront and more.',
  alternates: { canonical: '/projects' },
  openGraph: { url: '/projects' },
};

export const viewport: Viewport = {
  themeColor: '#ebebe9',
  colorScheme: 'light',
};

// Titles longer than this step down from poster size.
const LONG_TITLE = 12;

const plateId = (project: Project) => `case-${project.slug}`;

function Caption({ project }: { project: Project }) {
  return (
    <div className="max-w-[40rem]">
      <p className="text-body-lg leading-relaxed text-muted-foreground">{project.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-2 text-body-sm font-medium">
        <Link href={`/projects/${project.slug}`} className="link">
          Read the case study<span className="sr-only">: {project.title}</span>
        </Link>
        {project.liveUrl && (
          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5">
            Live site
            <ArrowOut className="size-3.5" />
            <span className="sr-only">for {project.title} (opens in a new tab)</span>
          </a>
        )}
        {project.repoUrl && (
          <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5">
            Source
            <ArrowOut className="size-3.5" />
            <span className="sr-only">for {project.title} (opens in a new tab)</span>
          </a>
        )}
      </div>
    </div>
  );
}

export default async function ProjectsPage() {
  const { projects, unavailable } = await getProjects();

  return (
    <div className={`canvas-page ${displayFont.variable}`}>
      <header className="container-page pt-[clamp(3rem,9vw,8rem)] text-center">
        <h1 className="font-display text-mega">Work</h1>
        <p className="mx-auto mt-[clamp(1.5rem,3vw,2.5rem)] max-w-[34rem] text-lead text-muted-foreground">
          {projects.length > 0
            ? 'Built end to end, with the decisions behind them. Open one for the full write-up.'
            : unavailable
              ? 'The case studies didn’t load. These three run live on this site.'
              : 'Case studies are on the way. These three run live on this site.'}
        </p>
      </header>

      {projects.length > 0 ? (
        projects.map((project, index) => {
          const following = projects[index + 1];
          return (
            <Plate
              key={project._id}
              id={plateId(project)}
              number={index + 1}
              title={project.title}
              long={project.title.length > LONG_TITLE}
              transition={project.slug}
              preview={previewForProject(project)}
              fallback={<StackWindow techStack={project.techStack} />}
              target={{ kind: 'link', href: `/projects/${project.slug}` }}
              targetLabel={`Read the ${project.title} case study`}
              caption={<Caption project={project} />}
              next={
                following
                  ? { href: `#${plateId(following)}`, label: following.title }
                  : { href: '#contact', label: 'Start a project' }
              }
            />
          );
        })
      ) : (
        <LiveSystemPlates last={{ href: '#contact', label: 'Start a project' }} />
      )}

      <ContactPlate />
    </div>
  );
}
