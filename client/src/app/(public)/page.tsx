import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import type { Project } from '@/types/project';
import TypewriterText from '@/components/effects/TypewriterText';
import AnimatedCounter from '@/components/effects/AnimatedCounter';
import Card from '@/components/ui/Card';

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Biniyam Abera',
  jobTitle: 'Full-Stack Software Engineer',
  description: 'A production-grade, ultra-fast full-stack showcase featuring a live creator analytics SaaS, secure admin controls, and modern Next.js architecture engineered for human users and AI search engines alike.',
  url: 'https://www.biniyam.com/',
  sameAs: [
    'https://github.com/binicode',
    'https://linkedin.com/in/biniyam-abera-a7bbb8410',
  ],
};

export default async function HomePage() {
  const projects = await apiClient.get<Project[]>('/projects', {
    next: { revalidate: 60 },
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Biniyam Abera
        </h1>
        <p className="mt-4 text-lg text-muted">
          <TypewriterText text="Full-Stack Software Engineer · Civil Engineer · Meta & IBM Certified" />
        </p>

        <div className="mt-8 max-w-2xl space-y-4 text-gray-700 leading-relaxed">
          <p>
            I am a Full-Stack Software Engineer with a background in Civil Engineering,
            combining engineering discipline, systems thinking, and modern software
            development to build reliable digital products.
          </p>

          <p>
            Certified through the <strong>Meta Front-End Developer</strong> and{' '}
            <strong>IBM JavaScript Back-End Developer</strong> Professional Certificates,
            I build end-to-end applications with <strong>Next.js, TypeScript,
              Node.js, Express, and MongoDB</strong>—from polished user interfaces and
            modular <strong>REST APIs</strong> to secure, scalable backend systems.
          </p>

          <p>
            I care about more than simply making software work. I focus on building
            <strong> clean, resilient, maintainable, and high-performance systems</strong>
            with thoughtful architecture, responsive experiences, and a strong focus
            on real-world usability.
          </p>
        </div>

        <div className="mt-10">
          <Link
            href="/projects"
            className="inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
          >
            View Projects
          </Link>
        </div>

        <div className="mt-16 max-w-xs">
          <Card>
            <AnimatedCounter target={projects.length} label="Projects Shipped" />
          </Card>
        </div>
      </section>
    </>
  );
}
