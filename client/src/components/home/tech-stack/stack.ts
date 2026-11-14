import type { TechLogoId } from './TechLogo';

/**
 * The four layers of the stack, in the order the hero brings them forward.
 * Single source for the orbit cards, the progress legend and the static
 * fallback grid. Plain data: safe to import anywhere.
 */

export interface StackTechnology {
  name: string;
  /** Omitted for concepts without a brand mark (REST, vector search). */
  logo?: TechLogoId;
}

export interface StackCategory {
  key: 'A' | 'B' | 'C' | 'D';
  slug: 'interface' | 'api' | 'data' | 'services';
  name: string;
  technologies: StackTechnology[];
  description: string;
}

export const STACK: readonly StackCategory[] = [
  {
    key: 'A',
    slug: 'interface',
    name: 'Interface',
    technologies: [
      { name: 'Next.js', logo: 'nextjs' },
      { name: 'React', logo: 'react' },
      { name: 'TypeScript', logo: 'typescript' },
    ],
    description: 'Server-rendered. Light on JavaScript.',
  },
  {
    key: 'B',
    slug: 'api',
    name: 'API',
    technologies: [{ name: 'Node.js', logo: 'nodejs' }, { name: 'Express.js', logo: 'express' }, { name: 'REST API' }],
    description: 'Validated input. Server-side access checks.',
  },
  {
    key: 'C',
    slug: 'data',
    name: 'Data',
    technologies: [{ name: 'MongoDB Atlas', logo: 'mongodb' }, { name: 'Vector Search' }],
    description: 'Accounts, content and AI search.',
  },
  {
    key: 'D',
    slug: 'services',
    name: 'Services',
    technologies: [
      { name: 'Stripe', logo: 'stripe' },
      { name: 'Shopify', logo: 'shopify' },
      { name: 'Google Gemini', logo: 'gemini' },
      { name: 'Voyage AI', logo: 'voyage' },
    ],
    description: 'Billing, commerce and AI, with fallbacks.',
  },
];
