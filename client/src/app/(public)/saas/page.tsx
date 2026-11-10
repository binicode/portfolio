import type { Metadata } from 'next';
import ButtonLink from '@/components/ui/ButtonLink';
import DashboardPreview from '@/components/saas/DashboardPreview';
import PointerLight from '@/components/effects/PointerLight';

export const metadata: Metadata = {
  title: 'Creator Dashboard',
  description:
    'Creator Dashboard is a working subscription product: sign up, subscribe through Stripe Checkout, and see GitHub, YouTube and Hacker News numbers in one dashboard.',
  alternates: { canonical: '/saas' },
  openGraph: { url: '/saas' },
};

const STEPS = [
  {
    title: 'Create an account',
    body: 'Sign up with an email address and a password of at least 8 characters.',
  },
  {
    title: 'Subscribe',
    body: 'Checkout runs on Stripe. The price is shown on the Stripe page before you pay.',
  },
  {
    title: 'Connect your sources',
    body: 'Add a GitHub username, a YouTube channel ID and a Hacker News search query in Settings.',
  },
  {
    title: 'Read one dashboard',
    body: 'Followers, stars, subscribers, views and mentions, side by side.',
  },
];

const ENGINEERING = [
  {
    title: 'Payments are verified',
    body: 'Every Stripe webhook is checked against the signing secret before a subscription changes state.',
  },
  {
    title: 'Access is enforced on the server',
    body: 'The stats API checks the account’s subscription on every request. The page redirect is a convenience, not the lock.',
  },
  {
    title: 'One failing source stays contained',
    body: 'GitHub, YouTube and Hacker News are fetched separately, so an outage at one provider leaves the other panels working.',
  },
  {
    title: 'Sessions stay out of reach of scripts',
    body: 'Sign-in uses an httpOnly, SameSite=Strict cookie that is marked Secure in production.',
  },
];

export default function SaasPage() {
  return (
    <>
      <section aria-labelledby="saas-title" className="theme-ink overflow-hidden">
        <PointerLight>
          <div className="container-page pb-section pt-[clamp(3rem,7vw,6.5rem)]">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
              <h1 id="saas-title" className="lg:col-span-8">
                <span className="label block text-accent">Creator Dashboard</span>
                <span className="mt-5 block text-h1 font-medium">
                  Your GitHub, YouTube and Hacker News numbers in one place.
                </span>
              </h1>
              <div className="lg:col-span-4 lg:pb-1">
                <p className="text-[1.0625rem] leading-relaxed text-muted-foreground">
                  A working subscription product built for this portfolio, with real accounts, real Stripe billing and a
                  dashboard that keeps working when a provider doesn’t.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href="/saas/signup">Create an account</ButtonLink>
                  <ButtonLink href="/saas/login" variant="secondary">
                    Log in
                  </ButtonLink>
                </div>
              </div>
            </div>

            <DashboardPreview className="mt-14 lg:mt-20" />
          </div>
        </PointerLight>
      </section>

      <section aria-labelledby="steps-title" className="py-section">
        <div className="container-page">
          <h2 id="steps-title" className="text-h2 font-medium">
            How it works
          </h2>
          <ol className="mt-12 grid gap-px border-y border-foreground/80 bg-border sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="bg-background py-7 sm:pr-6 sm:even:pl-6 lg:pl-6 lg:first:pl-0">
                <span className="label tabular-nums text-accent">
                  Step {index + 1}
                </span>
                <h3 className="mt-6 text-h3 font-semibold">{step.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="engineering-title" className="pb-section">
        <div className="container-page grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <h2 id="engineering-title" className="text-h2 font-medium">
              Built like a real product
            </h2>
            <p className="mt-5 max-w-[24rem] text-muted-foreground">
              The parts you don’t see are where a SaaS earns trust. These are the decisions behind them.
            </p>
          </div>
          <dl className="border-t border-border lg:col-span-7 lg:col-start-6">
            {ENGINEERING.map((item) => (
              <div key={item.title} className="grid gap-2 border-b border-border py-6 sm:grid-cols-[14rem_1fr] sm:gap-8">
                <dt className="font-medium">{item.title}</dt>
                <dd className="text-muted-foreground">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="start-title" className="pb-section">
        <div className="container-page">
          <div className="flex flex-col gap-8 border-y border-border py-12 lg:flex-row lg:items-center lg:justify-between lg:py-16">
            <h2 id="start-title" className="text-h2 font-medium">
              Try it with your own accounts.
            </h2>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/saas/signup">Create an account</ButtonLink>
              <ButtonLink href="/projects" variant="secondary">
                See the rest of my work
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
