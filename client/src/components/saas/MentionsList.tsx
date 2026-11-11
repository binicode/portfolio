import Badge from '@/components/ui/Badge';
import type { HackerNewsMention } from '@/types/saas';
import { formatTimeAgo } from './format';

/** Newest Hacker News mentions, linked to the item on news.ycombinator.com. */
export default function MentionsList({ mentions, now }: { mentions: HackerNewsMention[]; now: number }) {
  return (
    <ol className="divide-y divide-border">
      {mentions.map((mention) => (
        <li key={mention.url} className="py-3.5 first:pt-0 last:pb-0">
          <div className="flex items-center gap-2.5">
            <Badge variant="muted">{mention.kind === 'story' ? 'Story' : 'Comment'}</Badge>
            <time dateTime={mention.createdAt} className="label text-muted-foreground">
              {formatTimeAgo(mention.createdAt, now)}
            </time>
          </div>
          <a
            href={mention.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 line-clamp-2 block text-[0.9375rem] leading-snug hover:text-accent"
          >
            {mention.title}
          </a>
        </li>
      ))}
    </ol>
  );
}
