import type { Metadata } from 'next';
import { getProjects } from '@/lib/projects';
import ProjectLedger from '@/components/work/ProjectLedger';
import OpenChatButton from '@/components/chat/OpenChatButton';

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Case studies of products Biniyam Abera designed and built: a subscription SaaS with Stripe billing, a retrieval-augmented AI assistant, a headless Shopify storefront and more.',
  alternates: { canonical: '/projects' },
  openGraph: { url: '/projects' },
};

export default async function ProjectsPage() {
  const { projects, unavailable } = await getProjects();

  return (
    <div className="container-page pb-section pt-[clamp(3rem,7vw,6.5rem)]">
      <header className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <h1 className="font-wide text-h1 font-semibold lg:col-span-7">Work</h1>
        <p className="max-w-[30rem] text-lead text-muted-foreground lg:col-span-5">
          Products I designed and built end to end, with the reasoning behind the main technical decisions.
        </p>
      </header>

      <div className="mt-14 lg:mt-20">
        {projects.length > 0 ? (
          <ProjectLedger projects={projects} headingLevel="h2" />
        ) : (
          <div className="border-y border-border py-12">
            <p className="text-lead">
              {unavailable ? 'The project list can’t be loaded right now.' : 'No case studies are published yet.'}
            </p>
            <p className="mt-2 text-muted-foreground">
              {unavailable ? 'Refresh in a minute, or ' : 'In the meantime, '}
              <OpenChatButton className="link">ask the assistant about my work</OpenChatButton>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
