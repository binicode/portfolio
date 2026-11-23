import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/site/LegalPage';
import { contactHref, site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'The terms for using the Creator Dashboard and its subscription.',
  alternates: { canonical: '/terms' },
  openGraph: { url: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated="23 November 2026"
      intro={
        <p>
          These terms cover the Creator Dashboard, a subscription run by {site.name}. By creating an account you agree to
          them.
        </p>
      }
    >
      <section>
        <h2>The service</h2>
        <p>
          The dashboard shows public numbers from GitHub, YouTube and Hacker News for the names you enter. Those services
          decide what they publish and when: their numbers can be late, change or be unavailable, and the dashboard shows
          what they return.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <p>
          Use an email address you can receive mail at: confirmation, password resets and receipts go there. Keep your
          password to yourself. Don&apos;t use the dashboard to break the law or the terms of the services it reads from,
          or to overload or attack it.
        </p>
      </section>

      <section>
        <h2>Subscription and payment</h2>
        <p>
          The price and billing period are shown at checkout, before you pay. Stripe takes the payment, and the
          subscription renews each period until you cancel it.
        </p>
        <p>
          You can cancel at any time in Settings, under Manage billing. Deleting your account also cancels the
          subscription, at once.
        </p>
      </section>

      <section>
        <h2>Ending and changes</h2>
        <p>
          You can delete your account at any time; the <Link href="/privacy" className="link text-foreground">privacy page</Link>{' '}
          says what that removes. These terms may change; the date at the top shows when they last did.
        </p>
      </section>

      <section>
        <h2>Questions</h2>
        <p>
          <a href={contactHref} target="_blank" rel="noopener noreferrer" className="link text-foreground">
            Message me on LinkedIn
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
