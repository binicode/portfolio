/** Layers of the stack drawing (callout letters A–D). Plain data: safe in client components. */
export const STACK_LEGEND = [
  {
    key: 'A',
    layer: 'Interface',
    detail: 'Next.js, React, TypeScript',
    body: 'Pages render on the server with the Next.js App Router; only the small interactive parts ship JavaScript.',
  },
  {
    key: 'B',
    layer: 'API',
    detail: 'Node.js, Express, REST',
    body: 'Express routes validate every input, keep sessions in httpOnly cookies, and check access on the server for each protected request.',
  },
  {
    key: 'C',
    layer: 'Data',
    detail: 'MongoDB Atlas, Vector Search',
    body: 'Projects, accounts and chat history live in MongoDB Atlas; Atlas Vector Search powers the assistant’s retrieval.',
  },
  {
    key: 'D',
    layer: 'Services',
    detail: 'Stripe, Shopify, Gemini, Voyage AI',
    body: 'Stripe runs subscriptions, Shopify the storefront, Gemini and Voyage AI the assistant — the AI calls with timeouts and fallbacks.',
  },
] as const;
