import type { Metadata } from 'next';
import LegalPage from '@/components/site/LegalPage';
import { contactHref, site } from '@/lib/site';
import { pageOpenGraph } from '@/lib/open-graph';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What this site collects, why, where it goes and how long it is kept.',
  alternates: { canonical: '/privacy' },
  openGraph: pageOpenGraph({ url: '/privacy' }),
};

// Every statement here is checked against the code: retention periods are
// the TTL indexes (chat 30 days, briefs 365 days), and the API's request log
// has no IPs, bodies or query strings (server http-hygiene.ts).
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="23 November 2026"
      intro={
        <p>
          This site is run by {site.name}. It collects only what its features need, uses no analytics or advertising, and sets
          no tracking cookies.
        </p>
      }
    >
      <section>
        <h2>The assistant</h2>
        <p>
          What you type to the assistant and its answers are stored with a random conversation id, which your browser keeps
          in local storage so the conversation is there when you come back. They are deleted 30 days after the last
          message.
        </p>
        <p>
          To answer, your message is sent to Google (Gemini). To find the right notes about my work, your question is also
          sent to Voyage AI.
        </p>
      </section>

      <section>
        <h2>The project planner</h2>
        <p>
          Your answers stay in your browser until you send a brief. The planner sends them to Google (Gemini) to write its
          notes and the brief.
        </p>
        <p>
          When you send a brief, I receive your name, the email address or LinkedIn profile you give, the brief and your
          answers. They are stored for 12 months, then deleted, and emailed to me. No IP address or browser details are
          stored with them.
        </p>
      </section>

      <section>
        <h2>Creator Dashboard accounts</h2>
        <ul>
          <li>Your email address, and whether you confirmed it.</li>
          <li>Your password, stored only as a one-way hash that can&apos;t be turned back into the password.</li>
          <li>Your subscription&apos;s state and your Stripe customer id.</li>
          <li>The GitHub, YouTube and Hacker News names you enter, so the dashboard can fetch their public numbers.</li>
        </ul>
        <p>
          Payments are handled by Stripe: card details never reach this site. Confirmation and password-reset emails are
          sent through Resend.
        </p>
        <p>
          All of this is kept until you delete your account (Settings, then Delete account). Deleting it cancels any
          subscription at once and removes the account. Stripe keeps its own records of past payments.
        </p>
      </section>

      <section>
        <h2>Cookies and local storage</h2>
        <p>
          Signing in sets one cookie, which keeps you signed in for up to 7 days. Your browser&apos;s local storage holds the
          assistant&apos;s conversation id and the planner&apos;s progress. Nothing else is stored on your device.
        </p>
      </section>

      <section>
        <h2>Logs and hosting</h2>
        <p>
          The site&apos;s server logs each request&apos;s method, page, status and duration, without IP addresses or what was
          sent. The site runs on Netlify, its server on Render and its database on MongoDB Atlas; these providers, and those
          above, may process data in the United States and keep their own logs.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can delete a dashboard account yourself at any time. To ask what I hold about you, or to have a brief or a
          conversation deleted sooner,{' '}
          <a href={contactHref} target="_blank" rel="noopener noreferrer" className="link text-foreground">
            message me on LinkedIn
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
