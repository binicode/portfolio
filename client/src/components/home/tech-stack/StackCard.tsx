import type { ReactNode } from 'react';
import TechLogo from './TechLogo';
import type { StackCategory } from './stack';

/**
 * One layer of the stack: key and name, its drawing, the technologies (brand
 * mark plus name, so nothing relies on recognising a logo) and one line on
 * what it does. Used in the orbit and in the static grid.
 */
export default function StackCard({ category, art }: { category: StackCategory; art: ReactNode }) {
  const titleId = `stack-${category.slug}`;
  return (
    <article aria-labelledby={titleId} className="stack-card">
      <h3 id={titleId} className="label flex items-baseline gap-2 text-foreground">
        <span className="text-accent-bright">{category.key}.</span>
        {category.name}
      </h3>

      <div className="stack-card-art">{art}</div>

      <ul aria-label={`${category.name} technologies`} className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {category.technologies.map((technology) => (
          <li key={technology.name} className="label flex items-center gap-1.5 text-foreground">
            {technology.logo ? (
              <TechLogo id={technology.logo} className="size-3.5 shrink-0" />
            ) : (
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full border border-current" />
            )}
            {technology.name}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-sm leading-snug text-muted-foreground">{category.description}</p>
    </article>
  );
}
