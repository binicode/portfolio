import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import AuthShell from '@/components/site/AuthShell';

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

const POINTS = [
  'GitHub followers, repositories and stars',
  'YouTube subscribers, views and videos',
  'Hacker News mentions for any search term',
];

export default function SaasAuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthShell
      backHref="/saas"
      backLabel="Product overview"
      aside={
        <>
          <p className="text-lead text-muted-foreground">Creator Dashboard</p>
          <div>
            <p className="max-w-[16ch] font-wide text-h2 font-semibold">Your reach, in one dashboard.</p>
            <ul className="mt-10 space-y-3 border-t border-border pt-8 text-[0.9375rem] text-muted-foreground">
              {POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </>
      }
    >
      {children}
    </AuthShell>
  );
}
