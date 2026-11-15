import OpenChatButton from '@/components/chat/OpenChatButton';
import PillParts, { pillClasses } from '@/components/ui/PillAction';
import { buildFromStack } from '@/lib/discovery/flow';

interface ProjectCtaProps {
  title: string;
  techStack: readonly string[];
  className?: string;
}

/**
 * The case study's call to action, where interest peaks: plan a project
 * like this one (the planner opens with its type preselected), or ask how
 * it was built (the question is placed in the chat box, ready to send).
 */
export default function ProjectCta({ title, techStack, className = '' }: ProjectCtaProps) {
  return (
    <div className={className}>
      <p className="font-semibold">Need something like this?</p>
      <p className="mt-1 text-body-sm text-muted-foreground">Plan yours in about 2 minutes, or ask how this one works.</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 lg:flex-col lg:items-start">
        <OpenChatButton mode="discovery" build={buildFromStack(techStack)} className={pillClasses()}>
          <PillParts size="sm">Plan a similar project</PillParts>
        </OpenChatButton>
        <OpenChatButton mode="chat" question={`How was ${title} built?`} className="link text-body-sm font-medium">
          Ask how it was built
        </OpenChatButton>
      </div>
    </div>
  );
}
