import type { ReactNode } from 'react';

/** The plain reading layout shared by the privacy and terms pages. */
export default function LegalPage({ title, updated, intro, children }: { title: string; updated: string; intro: ReactNode; children: ReactNode }) {
  return (
    <div className="container-page pb-section pt-[clamp(3rem,7vw,6.5rem)]">
      <article className="max-w-[44rem]">
        <header>
          <h1 className="text-h1 font-medium">{title}</h1>
          <p className="label mt-4 text-dim">Last updated {updated}</p>
          <div className="mt-8 text-lead text-muted-foreground">{intro}</div>
        </header>
        <div className="mt-12 space-y-12 [&_h2]:text-h3 [&_h2]:font-medium [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:text-muted-foreground [&_li]:text-muted-foreground">
          {children}
        </div>
      </article>
    </div>
  );
}
