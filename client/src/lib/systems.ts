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
    name: 'AI assistant',
    body: 'AI chat grounded in my own notes. Cites its sources.',
    action: { kind: 'chat', label: 'Try the assistant' },
    stack: ['Next.js', 'Express', 'SSE', 'MongoDB Atlas Vector Search', 'Voyage AI', 'Gemini', 'TypeScript'],
  },
  {
    name: 'Creator Dashboard',
    body: 'A paid SaaS: sign-up, Stripe subscriptions, live data dashboard.',
    action: { kind: 'link', label: 'Explore the dashboard', href: '/saas' },
    stack: ['Next.js', 'Express', 'MongoDB', 'Stripe', 'TypeScript'],
  },
  {
    name: 'Shopify store',
    body: 'A custom storefront with Shopify’s own checkout.',
    action: { kind: 'link', label: 'Browse the store', href: '/shop' },
    stack: ['Next.js', 'Shopify Storefront API', 'TypeScript'],
  },
];
