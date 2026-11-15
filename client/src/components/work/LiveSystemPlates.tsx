import Link from 'next/link';
import OpenChatButton from '@/components/chat/OpenChatButton';
import { ArrowOut } from '@/components/ui/Arrow';
import { LIVE_SYSTEMS, type LiveSystem } from '@/lib/systems';
import type { Project } from '@/types/project';
import Plate from './Plate';

function Caption({ system, caseStudy }: { system: LiveSystem; caseStudy?: Project }) {
  return (
    <div className="max-w-[40rem]">
      <p className="text-body-lg leading-relaxed">
        <span className="font-semibold">{system.name}.</span> <span className="text-muted-foreground">{system.body}</span>
      </p>
      <p className="mt-1 text-body-sm text-muted-foreground">Built with {system.stack.join(', ')}.</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-2 text-body-sm font-medium">
        {system.action.kind === 'chat' ? (
          <OpenChatButton mode="chat" className="link inline-flex items-center gap-1.5">
            {system.action.label}
            <ArrowOut className="size-3.5" />
          </OpenChatButton>
        ) : (
          <Link href={system.action.href} className="link inline-flex items-center gap-1.5">
            {system.action.label}
            <ArrowOut className="size-3.5" />
          </Link>
        )}
        {caseStudy && (
          <Link href={`/projects/${caseStudy.slug}`} className="link">
            Read the case study
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * The products that run on this site, one plate each, chained by the arrows
 * at their feet. A product's case study is linked when the CMS has one.
 */
export default function LiveSystemPlates({
  projects = [],
  last,
}: {
  projects?: Project[];
  /** Where the last plate's arrow goes. */
  last?: { href: string; label: string };
}) {
  return (
    <>
      {LIVE_SYSTEMS.map((system, index) => {
        const following = LIVE_SYSTEMS[index + 1];
        const caseStudy = projects.find((project) => system.caseStudy.test(`${project.title} ${project.slug}`));
        return (
          <Plate
            key={system.id}
            id={system.id}
            number={index + 1}
            title={system.title}
            preview={system.preview}
            target={system.action.kind === 'chat' ? { kind: 'chat' } : { kind: 'link', href: system.action.href }}
            targetLabel={system.action.label}
            caption={<Caption system={system} caseStudy={caseStudy} />}
            next={following ? { href: `#${following.id}`, label: following.name } : last}
          />
        );
      })}
    </>
  );
}
