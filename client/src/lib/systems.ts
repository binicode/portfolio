/**
 * The three products that run on this site. Shown on the home page, and
 * on the work page while the CMS has no published case studies.
 */
export type LiveSystem = {
  name: string;
  body: string;
  action: { kind: 'chat'; label: string } | { kind: 'link'; label: string; href: string };
};

export const LIVE_SYSTEMS: LiveSystem[] = [
  {
    name: 'Portfolio assistant',
    body: 'Retrieval-augmented chat. Questions are matched against my notes with Voyage AI embeddings and MongoDB Atlas Vector Search, then Gemini streams the answer with its sources.',
    action: { kind: 'chat', label: 'Ask the assistant' },
  },
  {
    name: 'Creator Dashboard',
    body: 'A paid SaaS product: accounts, Stripe Checkout subscriptions with verified webhooks, and one dashboard for GitHub, YouTube and Hacker News numbers.',
    action: { kind: 'link', label: 'See the product', href: '/saas' },
  },
  {
    name: 'Headless storefront',
    body: 'Products come from the Shopify Storefront API and are rendered on the server. Checkout is handed to Shopify.',
    action: { kind: 'link', label: 'Visit the shop', href: '/shop' },
  },
];
