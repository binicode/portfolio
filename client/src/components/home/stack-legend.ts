/** Layers of the stack drawing (callout letters A–D). Plain data: safe in client components. */
export const STACK_LEGEND = [
  {
    key: 'A',
    layer: 'Interface',
    detail: 'Next.js, React, TypeScript',
    body: 'Server-rendered pages that load fast and ship little JavaScript.',
  },
  {
    key: 'B',
    layer: 'API',
    detail: 'Node.js, Express, REST',
    body: 'Every input validated, every protected request checked on the server.',
  },
  {
    key: 'C',
    layer: 'Data',
    detail: 'MongoDB Atlas, Vector Search',
    body: 'Accounts, content and AI search in one database.',
  },
  {
    key: 'D',
    layer: 'Services',
    detail: 'Stripe, Shopify, Gemini, Voyage AI',
    body: 'Billing, commerce and AI that keeps answering when a provider fails.',
  },
] as const;
