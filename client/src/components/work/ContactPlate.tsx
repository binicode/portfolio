import OpenChatButton from '@/components/chat/OpenChatButton';
import PillParts, { pillClasses } from '@/components/ui/PillAction';
import { contactHref } from '@/lib/site';

/** The portfolio pages' close: one question at poster size, and two ways to answer it. */
export default function ContactPlate() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="container-page pb-[clamp(5rem,10vw,9rem)] pt-[clamp(6rem,14vw,12rem)] text-center"
    >
      <h2 id="contact-title" className="mx-auto max-w-[13ch] font-display text-poster">
        Have something that needs to hold up?
      </h2>
      <p className="mx-auto mt-7 max-w-[32rem] text-lead text-muted-foreground">
        Plan it with my assistant in about 2 minutes. You get a project brief to send me.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <OpenChatButton mode="discovery" className={pillClasses()}>
          <PillParts>Plan your project</PillParts>
        </OpenChatButton>
        <a href={contactHref} target="_blank" rel="noopener noreferrer" className={pillClasses()}>
          <PillParts tone="outline">Message me on LinkedIn</PillParts>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </section>
  );
}
