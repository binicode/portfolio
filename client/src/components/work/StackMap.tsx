import TechLogo from '@/components/home/tech-stack/TechLogo';
import { stackLayers, type LayerSlug, type StackItem } from '@/lib/stack-layers';

// Where each layer runs, in plain words; shown under the layer names in the wide flow.
const WHERE: Record<LayerSlug, string> = {
  interface: 'In the browser',
  api: 'On the server',
  data: 'Stored',
  services: 'Third parties',
};

function Chip({ tech, block = false }: { tech: StackItem; block?: boolean }) {
  return (
    <li
      title={tech.name}
      className={`stack-chip min-w-0 max-w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-caption leading-none text-foreground/90 ${
        block ? 'flex' : 'inline-flex'
      }`}
    >
      {tech.logo ? (
        <TechLogo id={tech.logo} className="size-3.5 shrink-0" />
      ) : (
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-foreground/40" />
      )}
      <span className="truncate">{tech.name}</span>
    </li>
  );
}

/**
 * A project drawn as the system it is: its technologies placed on the four
 * layers the hero introduces (Interface → API → Data → Services), joined by
 * a rust request path, with real technology marks. Data-driven from the
 * CMS stack, so every project gets an accurate visual with no screenshot.
 *
 * - `lanes`: layers stacked as rows (compact cards, case studies).
 * - `flow`: layers as columns, left to right, from a 34rem content width
 *   (the featured project); narrower, it falls back to rows.
 *
 * Server-rendered HTML and inline SVG marks; no client JavaScript.
 */
export default function StackMap({ techStack, layout = 'lanes', className = '' }: { techStack: readonly string[]; layout?: 'lanes' | 'flow'; className?: string }) {
  const { layers, languages } = stackLayers(techStack);
  const summary = `${layers.map((layer) => `${layer.name}: ${layer.items.map((tech) => tech.name).join(', ')}`).join('; ')}${
    languages.length > 0 ? `; written in ${languages.map((tech) => tech.name).join(', ')}` : ''
  }.`;

  return (
    <figure className={`stack-map @container relative overflow-hidden rounded-xl border border-border ${className}`}>
      <figcaption className="sr-only">Architecture. {summary}</figcaption>
      <ol aria-hidden="true" className={`stack-layers stack-${layout} relative`}>
        {layers.map((layer) => (
          <li key={layer.slug} className="stack-layer relative">
            <p className="flex items-center gap-2.5 font-mono text-micro uppercase tracking-[0.08em] text-muted-foreground">
              <span className="stack-node relative z-10 size-2 shrink-0 rounded-full border border-accent bg-background" />
              {layer.name}
              {/* In the wide flow, the path continues from the end of the name to the column edge. */}
              {layout === 'flow' && <span className="stack-line" />}
            </p>
            {layout === 'flow' && <p className="stack-where mt-1 pl-[1.125rem] text-xs text-muted-foreground">{WHERE[layer.slug]}</p>}
            <ul className="stack-chips">
              {layer.items.map((tech) => (
                <Chip key={tech.name} tech={tech} block={layout === 'flow'} />
              ))}
            </ul>
          </li>
        ))}
      </ol>
      {languages.length > 0 && (
        <p aria-hidden="true" className="relative mt-4 flex items-center gap-2 font-mono text-micro uppercase tracking-[0.08em] text-muted-foreground">
          {languages.map((tech) => (
            <span key={tech.name} className="inline-flex items-center gap-1.5 normal-case tracking-normal text-foreground/80">
              {tech.logo && <TechLogo id={tech.logo} className="size-3" />}
              <span className="font-sans text-xs">{tech.name}</span>
            </span>
          ))}
          <span>throughout</span>
        </p>
      )}
    </figure>
  );
}
