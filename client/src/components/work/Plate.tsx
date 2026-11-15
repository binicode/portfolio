import { ViewTransition, type ReactNode } from 'react';
import Link from 'next/link';
import { getImageProps } from 'next/image';
import { ArrowLong } from '@/components/ui/Arrow';
import OpenChatButton from '@/components/chat/OpenChatButton';
import type { Preview } from '@/lib/systems';

/** Where the window leads when clicked: a page, or the assistant. */
export type PlateTarget = { kind: 'link'; href: string } | { kind: 'chat' };

/** Only named elements take part in a route's view transition; unnamed ones stay put. */
function Shared({ name, children }: { name?: string; children: ReactNode }) {
  return name ? <ViewTransition name={name}>{children}</ViewTransition> : <>{children}</>;
}

/** "01", "02"… */
export const plateNumber = (n: number) => String(n).padStart(2, '0');

/**
 * The website in its window. Phones get the phone layout in a portrait
 * window; from 48rem the desktop layout (art direction with <picture>,
 * one request either way). Lazy: no plate is above the fold.
 */
function Screenshot({ preview }: { preview: Preview }) {
  const common = { alt: preview.alt };
  const {
    props: { srcSet: desktopSet },
  } = getImageProps({ ...common, src: preview.desktop, sizes: '(min-width: 84rem) 78rem, 92vw' });
  const { props: mobile } = getImageProps({ ...common, src: preview.mobile, sizes: '92vw' });
  return (
    <picture>
      <source media="(min-width: 48rem)" srcSet={desktopSet} sizes="(min-width: 84rem) 78rem, 92vw" />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- getImageProps supplies alt */}
      <img {...mobile} />
    </picture>
  );
}

/** A large pointer-only target over the window; keyboard users have the labelled action in the caption. */
function WindowTarget({ target, label }: { target: PlateTarget; label: string }) {
  const className = 'absolute inset-0 z-10 cursor-pointer';
  if (target.kind === 'chat') {
    return (
      <OpenChatButton mode="chat" pointerOnly className={className}>
        <span className="sr-only">{label}</span>
      </OpenChatButton>
    );
  }
  return (
    <Link href={target.href} aria-hidden="true" tabIndex={-1} className={className}>
      <span className="sr-only">{label}</span>
    </Link>
  );
}

interface PlateProps {
  id: string;
  number: number;
  title: string;
  titleAs?: 'h1' | 'h2' | 'h3';
  /** The window: a screenshot, or (with no screenshot) any dark content. */
  preview?: Preview | null;
  fallback?: ReactNode;
  target?: PlateTarget;
  targetLabel?: string;
  /** Under the window: what this is, and its actions. */
  caption?: ReactNode;
  /** The arrow on the right of the foot row. Omit on the last plate. */
  next?: { href: string; label: string };
  /** Long CMS titles step down from poster size so they hold one or two lines. */
  long?: boolean;
  /** A CMS slug: the title and window carry across to (and from) the case study. */
  transition?: string;
}

/**
 * One project, composed like the reference board: the name at poster size
 * in the serif, the website in a large rounded window, and a foot row with
 * the plate's numeral, a short caption and the long arrow to the next plate.
 */
export default function Plate({
  id,
  number,
  title,
  titleAs: Title = 'h2',
  preview,
  fallback,
  target,
  targetLabel = title,
  caption,
  next,
  long = false,
  transition,
}: PlateProps) {
  // In-page anchors stay plain links; routes get client navigation.
  const NextLink = next?.href.startsWith('#') ? 'a' : Link;
  return (
    <article id={id} aria-labelledby={`${id}-title`} className="container-page pt-[clamp(4.5rem,11vw,10rem)]">
      <Shared name={transition && `project-title-${transition}`}>
        <Title
          id={`${id}-title`}
          className={`mx-auto max-w-[16ch] text-center font-display ${long ? 'text-poster' : 'text-mega'}`}
        >
          {title}
        </Title>
      </Shared>

      <Shared name={transition && `project-plate-${transition}`}>
        <div className="plate-frame mt-[clamp(2.25rem,5.5vw,5.5rem)]">
          {preview ? <Screenshot preview={preview} /> : fallback}
          {target && <WindowTarget target={target} label={targetLabel} />}
        </div>
      </Shared>

      <div className="mt-[clamp(2rem,4.5vw,4.5rem)] grid grid-cols-[auto_1fr_auto] items-end gap-x-8 gap-y-6">
        {caption && <div className="col-span-3 md:col-span-1 md:col-start-2 md:row-start-1">{caption}</div>}
        <p className="col-start-1 text-numeral font-light text-muted-foreground tabular-nums md:row-start-1">
          <span className="sr-only">Project </span>
          {plateNumber(number)}
        </p>
        {next && (
          <NextLink href={next.href} className="plate-arrow col-start-3 justify-self-end md:row-start-1">
            <span className="sr-only">Next: {next.label}</span>
            <ArrowLong className="h-7 w-14" />
          </NextLink>
        )}
      </div>
    </article>
  );
}
