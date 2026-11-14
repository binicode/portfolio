import type { Metadata } from 'next';
import { getProjects } from '@/lib/projects';
import ProjectShowcase from '@/components/work/ProjectShowcase';
import LiveSystemsList from '@/components/work/LiveSystemsList';

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
        <h1 className="text-h1 font-medium lg:col-span-7">Work</h1>
        <p className="max-w-[30rem] text-lead text-muted-foreground lg:col-span-5">
          Built end to end, with the decisions behind them.
        </p>
      </header>

      <div className="mt-14 lg:mt-20">
        {projects.length > 0 ? (
          <ProjectShowcase projects={projects} headingLevel="h2" />
        ) : (
          <>
            <p className="mb-8 max-w-[40rem] text-muted-foreground">
              {unavailable
                ? 'Case studies didn’t load. These run live on this site:'
                : 'Case studies are coming. These run live on this site:'}
            </p>
            <LiveSystemsList />
          </>
        )}
      </div>
    </div>
  );
}
