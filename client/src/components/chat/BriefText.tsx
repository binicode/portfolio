import { parseBrief } from '@/lib/discovery/flow';

/**
 * A project brief's ## headings and - items as elements; the text is never
 * parsed as HTML. Used by the planner and the admin inquiries list.
 */
export default function BriefText({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="mt-3 space-y-2 text-sm leading-relaxed">
      {parseBrief(text).map((block, index) => {
        if (block.kind === 'heading') {
          return (
            <h4 key={index} className="pt-1 text-xs font-semibold text-muted-foreground">
              {block.text}
            </h4>
          );
        }
        if (block.kind === 'list') {
          return (
            <ul key={index} className="space-y-1">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="relative pl-3.5 before:absolute before:left-0 before:top-[0.6em] before:h-px before:w-2 before:bg-signal">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}
