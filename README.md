# Biniyam Abera: portfolio and live products

A freelance full-stack engineer's site, with two products running on it:

- **AI assistant**: answers questions about the work from a knowledge base
  (MongoDB Atlas Vector Search, Voyage AI embeddings, Google Gemini), and a
  project planner that ends in a brief.
- **Creator Dashboard** (`/saas`): a subscription SaaS. Sign-up, Stripe
  Checkout and webhooks, GitHub, YouTube and Hacker News numbers in one
  dashboard.

Plus a CMS admin (`/login`) for the case studies.

| Folder | What | Stack |
| --- | --- | --- |
| [`client/`](client) | The site, dashboards and admin | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| [`server/`](server) | The API | Express 5, Mongoose 9, Zod 4, TypeScript |
| [`docs/`](docs) | Deployment guide, rebuild records, release report, CMS content to paste | |

The client's design rules are in [`client/DESIGN-SYSTEM.md`](client/DESIGN-SYSTEM.md).

## Requirements

- **Node.js 22.18 or newer** (24 recommended; `.nvmrc` pins 24, as CI uses).
  Both packages declare it in `engines`.
- **MongoDB 7 or newer.** Atlas for production (Vector Search needs Atlas or
  a local Atlas deployment); any MongoDB for local development without the
  assistant's vector search.
- Accounts for the features you turn on: Google AI Studio (Gemini), Voyage
  AI, Stripe, a GitHub token and a YouTube Data API key. Every one
  is optional for running the site; each feature says when it isn't
  configured.

## Local setup

```bash
# API
cd server
npm ci
cp .env.example .env        # fill in MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH at least
npm run dev                 # http://localhost:4000, health at /health

# Site (second terminal)
cd client
npm ci
cp .env.example .env.local  # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm run dev                 # http://localhost:3000
```

Every variable is described in [`server/.env.example`](server/.env.example)
and [`client/.env.example`](client/.env.example). The API validates its own
at start-up and names anything missing.

Without a reachable database the API still starts: the assistant answers
from the notes built into the code, routes that need the database answer
503, `/health` reports `degraded`, and the connection is retried in the
background. With Atlas, add your IP address under Network Access first.

### The assistant's knowledge base

`npm run seed:kb` (in `server/`) embeds the notes in
`server/src/modules/ai-chat/knowledge-base.content.ts` with Voyage AI and
**replaces** the `knowledge_chunks` collection in the database `MONGODB_URI`
points at. Run it deliberately, once per environment and after editing the
notes; it needs `VOYAGE_API_KEY`.

### Checks

| | Client (`client/`) | Server (`server/`) |
| --- | --- | --- |
| Lint | `npm run lint` | `npm run lint` |
| Types | `npx tsc --noEmit` | `npx tsc --noEmit` |
| Unit tests | `npm test` | `npm test` |
| Build | `npm run build` | `npm run build` |
| End to end | `npm run test:e2e` | |

`npm run test:e2e` installs nothing on its own: run `npx playwright install
chromium` once. It builds the site against a local stand-in for the API
(`client/e2e/mock-api`), so it needs no keys or database, and runs
the journeys, axe and full-page screenshots on desktop and phone profiles.
`npm run test:e2e:report` opens the results. CI
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs all of the
above on every pull request.

## Deployment

This project runs on Netlify (site) and Render (API, `render.yaml`), with DNS at Namecheap:
step by step in [docs/deploy.md](docs/deploy.md). In general:

The site and the API deploy separately. Put them on one domain, the site on
`example.com` and the API on `api.example.com`: the session cookies are
`SameSite=Strict`, so the two must be the same site, and `COOKIE_DOMAIN`
shares the session with the site's server.

### Site: any Next.js host

1. Build from `client/` (`npm ci`, `npm run build`); on Netlify,
   `netlify.toml` sets this up.
2. Set the variables from `client/.env.example`:
   `NEXT_PUBLIC_API_URL=https://api.example.com/api`,
   `NEXT_PUBLIC_SITE_URL=https://example.com`, optionally
   `GITHUB_API_TOKEN`, and `SITE_INDEXING=on` only when the site should
   appear in search engines.
3. Add the domain. `NEXT_PUBLIC_*` values are built into the pages: change
   one, redeploy.

Any host that runs `next build` and `next start` on Node 22.18+ works the
same way.

### API: any Node host

Plain Node, no platform SDK. On Render, Railway, Fly.io, a VPS or similar:

- **Root directory:** `server`
- **Build:** `npm ci && npm run build`
- **Start:** `npm start` (runs `node dist/core/server.js`)
- **Health check path:** `/health`
- **Environment:** everything in `server/.env.example`, with
  `NODE_ENV=production`, `CLIENT_ORIGIN=https://example.com` (add preview
  origins comma-separated), `COOKIE_DOMAIN=example.com`, and `TRUST_PROXY=1`
  when the host puts one proxy in front (most do). Never `TRUST_PROXY=true`.

Or as a container, with [`server/Dockerfile`](server/Dockerfile):

```bash
docker build -t portfolio-api server
docker run --env-file server/.env -p 4000:4000 portfolio-api
```

On SIGTERM the API stops accepting connections, lets open requests finish
for up to 10 seconds, then disconnects from MongoDB.

### Stripe webhook

1. Stripe Dashboard > Developers > Webhooks > Add endpoint:
   `https://api.example.com/api/saas/billing/webhook`.
2. Events: `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
3. Copy the endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`. Set
   `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID` (a recurring price) in the
   same mode (test or live).

Locally, the Stripe CLI forwards events and prints a signing secret for
`.env`:

```bash
stripe listen --forward-to localhost:4000/api/saas/billing/webhook
```

The webhook verifies every signature on the raw body, records each event id
so a redelivery is processed once, and ignores an event older than the last
one applied to that customer. Access to the dashboard is read from the
database on every request, never from the browser.

### Atlas Vector Search index

The API creates this index on start-up when it can
(`ensureKnowledgeVectorIndex`). To create it by hand: Atlas > Database >
Search & Vector Search > Create Search Index > Atlas Vector Search > JSON
editor, on the `knowledge_chunks` collection, named `knowledge_vector_index`:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 512, "similarity": "cosine" },
    { "type": "filter", "path": "metadata.sourceType" },
    { "type": "filter", "path": "embeddingModel" }
  ]
}
```

The API creates this index, or updates an older definition of it, when it
connects. The embeddings come from `voyage-4-lite` at 512 dimensions, and
each chunk records its model: search only uses chunks from the current
model. After changing the model, run `npm run seed:kb` again.

## Security notes

- Secrets live only in the API's environment. The site's only browser
  values are the public `NEXT_PUBLIC_*` ones.
- Admin and Creator Dashboard sessions are separate httpOnly cookies, checked
  on the server for every protected route.
- Sign-in, sign-up, the assistant, the planner and Stripe Checkout have
  their own rate limits on top of a general one.
- The site sends a content security policy and the usual hardening headers
  (`client/src/lib/security-headers.ts`); the API sends its own
  (`server/src/core/middleware/http-hygiene.ts`).
