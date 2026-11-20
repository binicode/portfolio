import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import { listInquiries } from '@/lib/inquiries-admin-server';
import type { Inquiry } from '@/types/inquiry';
import Badge from '@/components/ui/Badge';
import BriefText from '@/components/chat/BriefText';
import InquiryActions from './inquiry-actions';

export const metadata: Metadata = { title: 'Inquiries' };

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

export default async function InquiriesPage() {
  const { items, stats } = await listInquiries();

  return (
    <div className="max-w-5xl">
      <h1 className="text-h2 font-medium">Inquiries</h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Briefs sent from the assistant’s project planner. Each one is deleted automatically 12 months after it arrives.
      </p>

      {/* The planner's conversion measure, without third-party analytics. */}
      <dl className="mt-6 grid grid-cols-3 border-y border-border">
        <Stat label="Total" value={stats.total} />
        <Stat label="New" value={stats.unread} />
        <Stat label="Last 30 days" value={stats.last30Days} />
      </dl>

      {items.length === 0 ? (
        <p className="mt-8 border-y border-border py-10 text-muted-foreground">
          No inquiries yet. They arrive when a visitor sends their brief from the planner.
        </p>
      ) : (
        <ul className="mt-8 border-t border-border">
          {items.map((inquiry) => (
            <InquiryRow key={inquiry._id} inquiry={inquiry} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r border-border px-4 py-4 last:border-r-0 first:pl-0">
      <dt className="label text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-h3 font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function InquiryRow({ inquiry }: { inquiry: Inquiry }) {
  const isNew = inquiry.readAt === null;
  const project = inquiry.transcript[0]?.a.join(', ');

  return (
    <li className="border-b border-border py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            <span className="truncate">{inquiry.name}</span>
            {isNew && (
              <Badge variant="signal" dot>
                New
              </Badge>
            )}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
            <ContactLink contact={inquiry.contact} />
            <time dateTime={inquiry.createdAt}>{dateFormat.format(new Date(inquiry.createdAt))} UTC</time>
          </p>
          {project && <p className="mt-1 text-sm">{project}</p>}
        </div>
        <InquiryActions id={inquiry._id} name={inquiry.name} read={!isNew} />
      </div>

      <details className="group mt-3">
        <summary className="label inline-flex min-h-9 cursor-pointer items-center text-muted-foreground hover:text-foreground">
          Brief and answers
        </summary>
        <div className="mt-2 grid gap-6 md:grid-cols-2">
          <BriefText text={inquiry.brief} />
          <dl className="mt-3 space-y-2 text-sm">
            {inquiry.transcript.map((entry, index) => (
              <div key={index}>
                <dt className="text-xs text-muted-foreground">{entry.q}</dt>
                <dd>{entry.a.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </div>
      </details>
    </li>
  );
}

/**
 * The server stores only a validated email address or a link it rebuilt on
 * linkedin.com; this checks again before anything becomes an href.
 */
function ContactLink({ contact }: { contact: Inquiry['contact'] }) {
  if (contact.kind === 'linkedin' && contact.value.startsWith('https://www.linkedin.com/in/')) {
    return (
      <a href={contact.value} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
        {contact.value.replace('https://www.', '')}
        <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  if (contact.kind === 'email' && /^[^\s:/?#@]+@[^\s:/?#@]+$/.test(contact.value)) {
    return (
      <a href={`mailto:${contact.value}`} className="link">
        {contact.value}
      </a>
    );
  }
  return <span>{contact.value}</span>;
}
