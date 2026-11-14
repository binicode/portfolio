/**
 * The three products that run on this site. Shown on the home page, and
 * on the work page while the CMS has no published case studies.
 */
export type LiveSystem = {
  name: string;
  body: string;
  action: { kind: 'chat'; label: string } | { kind: 'link'; label: string; href: string };
  /** What it runs on, for its architecture map (`StackMap`). */
  stack: string[];
};

export const LIVE_SYSTEMS: LiveSystem[] = [
  {
    name: 'Portfolio assistant',
    body: 'Chat with my notes. Answers stream in, with sources.',
    action: { kind: 'chat', label: 'Try the assistant' },
    stack: ['Next.js', 'Express', 'SSE', 'MongoDB Atlas Vector Search', 'Voyage AI', 'Gemini', 'TypeScript'],
  },
  {
    name: 'Creator Dashboard',
    body: 'A paid SaaS. Stripe billing, one dashboard for your reach.',
    action: { kind: 'link', label: 'Explore the dashboard', href: '/saas' },
    stack: ['Next.js', 'Express', 'MongoDB', 'Stripe', 'TypeScript'],
  },
  {
    name: 'Headless storefront',
    body: 'Shopify products, rendered on the server. Shopify checkout.',
    action: { kind: 'link', label: 'Browse the store', href: '/shop' },
    stack: ['Next.js', 'Shopify Storefront API', 'TypeScript'],
  },
];
