/**
 * Places a project's technologies (free text from the CMS) on the four
 * layers the hero introduces: Interface, API, Data, Services. Pure and
 * runtime-import free, so it runs under `node --test` directly.
 */
import type { TechLogoId } from '@/components/home/tech-stack/TechLogo';

export type LayerSlug = 'interface' | 'api' | 'data' | 'services';

export const LAYER_NAMES: Record<LayerSlug, string> = { interface: 'Interface', api: 'API', data: 'Data', services: 'Services' };

const ORDER: readonly LayerSlug[] = ['interface', 'api', 'data', 'services'];

// Languages run through every layer, so they get their own line instead of a lane.
const LANGUAGE = /^(type ?script|java ?script|python|go(lang)?|rust|java|kotlin|swift|ruby|php|c#|c\+\+)$/i;

// First match wins, most specific first: "Shopify Storefront API" is a
// service, not an API layer; "MongoDB Atlas Vector Search" is data.
const RULES: ReadonlyArray<{ layer: LayerSlug; test: RegExp }> = [
  { layer: 'data', test: /mongo|postgres|mysql|sqlite|redis|prisma|drizzle|supabase|firebase|dynamo|vector|elastic|mongoose/i },
  { layer: 'services', test: /stripe|shopify|gemini|openai|anthropic|voyage|vercel|aws|cloudflare|twilio|sendgrid|resend|algolia|auth0|clerk|docker|github actions/i },
  { layer: 'api', test: /express|node|nest|fastify|hono|koa|graphql|trpc|rest|\bsse\b|websocket|jwt|zod|server actions?|\bapi\b/i },
  { layer: 'interface', test: /next|react|vue|svelte|angular|astro|remix|tailwind|css|html|vite/i },
];

const LOGOS: ReadonlyArray<[RegExp, TechLogoId]> = [
  [/next/i, 'nextjs'],
  [/react/i, 'react'],
  [/type ?script/i, 'typescript'],
  [/node/i, 'nodejs'],
  [/express/i, 'express'],
  [/mongo/i, 'mongodb'],
  [/stripe/i, 'stripe'],
  [/shopify/i, 'shopify'],
  [/gemini/i, 'gemini'],
  [/voyage/i, 'voyage'],
];

export interface StackItem {
  name: string;
  logo?: TechLogoId;
}

export interface StackLayer {
  slug: LayerSlug;
  name: string;
  items: StackItem[];
}

export function layerOf(tech: string): LayerSlug {
  return RULES.find((rule) => rule.test.test(tech))?.layer ?? 'services';
}

function item(name: string): StackItem {
  const logo = LOGOS.find(([test]) => test.test(name))?.[1];
  return logo ? { name, logo } : { name };
}

/**
 * The layers a project actually uses, in stack order, each with its
 * technologies in the order they were entered, plus the languages.
 * Unrecognised names land in Services rather than being dropped.
 */
export function stackLayers(techStack: readonly string[]): { layers: StackLayer[]; languages: StackItem[] } {
  const seen = new Set<string>();
  const buckets: Record<LayerSlug, StackItem[]> = { interface: [], api: [], data: [], services: [] };
  const languages: StackItem[] = [];
  for (const raw of techStack) {
    const name = raw.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    if (LANGUAGE.test(name)) languages.push(item(name));
    else buckets[layerOf(name)].push(item(name));
  }
  return {
    layers: ORDER.filter((slug) => buckets[slug].length > 0).map((slug) => ({ slug, name: LAYER_NAMES[slug], items: buckets[slug] })),
    languages,
  };
}
