# Release report: `release/polish`

Branch `release/polish`, cut from `origin/main` at `2a82e5a` on 2026-11-20.
Not pushed, not merged, nothing deployed.

## Base branch

| Branch | Ahead of `feature/teal-sand` | Behind | `client/src` differs |
| --- | --- | --- | --- |
| `origin/main` (2a82e5a) | 14 | 0 | 17 files |
| `feature/qa-e2e-run` (9178b5d) | 11 | 0 | 17 files (same tree as `origin/main`) |
| `feature/e2e-playwright` (ba801ed) | 1 | 4 | 13 files |
| local `main` (322f679) | 0 | 25 | 106 files (the old charcoal-and-rust UI) |

**Choice: `origin/main`.** The brief said the redesign is not on `main`: that
is true of the local `main` only, which stopped at PR #1. GitHub's `main`
already contains the teal-and-sand redesign (PR #13), the Playwright setup
(PR #14) and the QA run and its fixes (PRs #15 to #17). `feature/qa-e2e-run`
has the same tree; `feature/e2e-playwright` is older and fully contained. So
there was no test work to bring over.

## Decisions

Where the brief left a choice, I took the option that is safest and easiest
to reverse.

1. **No database download.** Installing MongoDB locally (as the QA run did)
   is a download that needs your approval, and `server/.env` points at
   Atlas, which I didn't touch. The real API ran against an unreachable
   local URI: it booted, served health, CORS, headers and the assistant
   (real Gemini answers from the built-in notes). The pages' API-backed
   views (Selected work, case studies, sign-up, log-in) were verified with
   the e2e fixture API, which mirrors the real one's routes and shapes.
2. **"Front card about 1.6× larger" read as area.** 1.6× the width would
   have filled 28% of the frame and buried the side cards; it now fills
   19.4% (was 11.2%), 1.73× the area.
3. **Emphasis by weight.** `emph` is the same colour, weight 600 against the
   headline's 500. A darker step than the new ink (#062224) doesn't exist on
   sand, and on teal the old sea-glass emphasis was also lower contrast
   than the words around it.
4. **Accents.** Terracotta is now only the call to action. Besides the two
   items in the brief (launcher, stripe meter) I moved every other
   decorative terracotta to `signal`: the active nav underline, legend keys
   and bar, the orbit's centre line, the drawings' accent strokes, the
   planner's selected answers and progress bar, the dashboard and admin nav
   marks and avatars. Kept: the header's outlined "Plan your project" (it is
   an action, and the brief didn't list it), selection highlight, focus
   ring on teal, and the in-product buttons. With the header's outline and
   the hero's filled button, the first screen still shows terracotta twice,
   for the same action; see "Needs Biniyam".
5. **Launcher:** Deep Teal fill, sand text (7.6:1), a sand rim (4.8:1 against
   Deep Teal) so it stays visible over the teal footer, warm shadow on sand.
6. **Navigation hover** is a signal underline, not a colour fade, and the
   current page keeps the underline. Footer navigation follows the same rule
   (13px sans), since `label` is now for metadata only.
7. **Page titles** use a pipe (`Work | Biniyam Abera`) instead of an em dash
   (your banned list).
8. **Copy deviations:** the About facts render as label plus detail, so the
   third detail starts with a capital ("Interface, API, database. No
   handoffs."). Both new assistant suggestions stayed: the knowledge base
   seeded by `seed-knowledge-base.ts` (from `knowledge-base.content.ts`)
   covers shipped projects and Stripe billing. The SaaS demo window's title
   also became "Your reach", to match the real dashboard.
9. **CSP without nonces.** A nonce needs a new value per response, which
   would make every static and ISR page render on demand. The policy keeps
   `'unsafe-inline'` for scripts and styles and closes everything else
   (origins, plugins, framing, `<base>`, forms). It applies to pages only;
   on static files it only added bytes.
10. **Shop end-to-end:** the Shopify client only speaks HTTPS, so the e2e
    suite runs a local HTTPS stand-in with a throwaway self-signed
    certificate (made with openssl at start-up) and turns off TLS
    verification for the test Next server process only.
11. **DNS:** the server forced Google's resolvers for every lookup. That
    stays the default in development (your Atlas setup relied on it) and is
    opt-in in production (`DNS_SERVERS`), where a host's own resolver should
    be used.
12. **The assistant panel is now a modal dialog for the keyboard**
    (`aria-modal="true"`, Tab wraps inside), because on phones it covers
    the page.
13. **Not included:** `feature/send-brief` (your other session's unpushed
    work on sending the brief from the assistant). It is outside this brief
    and still waits for your review; it will need a rebase onto this
    branch, mainly in `DiscoveryFlow.tsx` and `ChatPanel.tsx`.
14. **Line endings:** the repository already stores LF; working copies mixed
    CRLF and LF. `.gitattributes` now checks everything out as LF; no file
    in the repository changed.
15. **Left in place:** `Claude outputs/ui-ux-pro-max.zip` (a tracked skill
    archive, not code). See "Needs Biniyam".

New dependencies: **no runtime dependencies added**; one removed
(`@anthropic-ai/sdk`, never imported). Dev only: `@axe-core/playwright`
(client, axe in Playwright, as the brief asked) and `eslint`, `@eslint/js`,
`typescript-eslint`, `globals` (server, which had no linter).

## Workstream 1: visual hierarchy

Measured on the home page with a script that reads every rendered text
node's computed style (`typeaudit.mjs`, scratch), before (base build) and
after, at 1440x900 and 375x812.

| | Before | After |
| --- | --- | --- |
| Largest text, 1440 | About numerals 128px, then H1 83px, footer line 83px | H1 83px, then h2s at 56px |
| Heading ladder, 1440 | h1 83, h2 56/39/11, h3 56/22/11 | h1 83, h2 56, featured h3 39 (title tier), h3 22 |
| Hero scene h2, 375 | 22px (= h3) | 32px |
| Font sizes in use, 1440 | 13 (128 … 11) | 11 (83 … 11) |
| Distinct text styles, 1440 | 32 | 33 |
| Nav | 11px mono uppercase, muted | 13px sans, foreground |
| Front stack card | 320x336, 11.2% of the frame, 14px copy, 11px title | 432x432, 19.4%, 16px copy, 22px title |
| Pinned hero | 400vh, 52.0% of the page's scroll (desktop), 40.7% (phone) | 300vh, 45.9%, 36.2% |

The distinct-style count barely moved: it counts each colour separately
(sand and teal text, muted, signal), and those are deliberate. What changed
is the size ladder and the order of the peaks.

Contrast, for every token pair touched (WCAG ratio, computed):

| Pair | Before | After |
| --- | --- | --- |
| Text on sand, at the field's darkest edge | #0b4a4a, 7.2:1 | #062224, 11.9:1 |
| Text on a sand rim (worst case) | | 8.3:1 |
| Muted text on the field's edge | 5.2:1 | 5.2:1 (unchanged) |
| Text against muted text (separation) | 1.4:1 | 2.3:1 |
| Emphasis on sand | #136f6e, 4.7:1 (lighter than its words) | same ink as its words, weight 600 |
| Solid sand button text (on teal) | 6.9:1 | 11.5:1 |
| Launcher text, rest / hover | ink on terracotta 4.9:1 | sand on Deep Teal 7.6:1 / 6.4:1 |
| Launcher rim against a teal section | | 4.8:1 |
| Stripe meter on the header | terracotta | sea glass 10.0:1 |
| Unread words while revealing (sand) | 0.7 opacity, 3.6:1 | 0.6 opacity, 4.0:1 |

Every screen got the same heading roles: public page titles `text-h1`;
sections, the footer line and app screen titles (sign-in, sign-up,
dashboard, unlock, settings, admin, product) `text-h2`; featured items,
closing calls to action and minor sections the `text-title` middle tier;
cards `text-h3`; the case study's own headings on the scale. The unused
display, stat and statement sizes are gone, and no one-off `text-[…]` size
remains. DESIGN-SYSTEM.md records each rule.

## Workstream 2: copy

Every item in the brief is applied, word for word, apart from the
capitalisation noted in Decisions. `PLANNER_NOTE` is in `lib/site.ts` and is
the only planner note on the site (hero, footer, phone menu, SaaS, case
study, assistant card, planner intro). The CMS content, the four summaries
and two case-study drafts (only facts from the code), is in
[`docs/content-updates.md`](content-updates.md) for you to paste.

## Workstream 3: production readiness

Each finding, with what was done:

| Area | Finding | Result |
| --- | --- | --- |
| Stripe | Webhooks had no idempotency and no ordering: a redelivered or late "active" could reopen a cancelled subscription | **Fixed**: event ids recorded (30-day TTL), newest event wins in one conditional write, failures release the id for Stripe's retry. Tests with locally signed events |
| Stripe | Checkout returned to `/dashboard` (the admin area) and cancelled to `/billing` (404) | **Fixed**: both go to `/saas/dashboard`. Test |
| Stripe | A checkout session completed with an unpaid delayed method granted access | **Fixed**: only `paid` or `no_payment_required` subscription checkouts do. Test |
| Stripe | Stripe's error messages (price ids, key fragments) were returned to the browser | **Fixed**: logged, generic message to the visitor |
| Stripe | Back from Checkout before the webhook, the page offered checkout again (a second subscription) | **Fixed**: "Payment received" with a refresh |
| Stripe | Signature on the raw body; entitlement read from the database on every request | Kept: already correct |
| Auth | Session cookies were host-only, so with the API on another host the site's server never saw them and the dashboards sent everyone back to log in (worked locally only because cookies ignore ports) | **Fixed**: optional `COOKIE_DOMAIN`, one set of attributes for setting and clearing. Tests |
| Auth | httpOnly, SameSite=Strict, Secure in production; admin and SaaS separate cookies and roles; every admin route behind one guard; auth rate limits | Kept |
| Auth | Logout clears the cookie but a copied token stays valid until it expires (7 days): JWTs are not revoked server-side | **Listed** (refactor: token version per account) |
| CSRF | Cookie auth is SameSite=Strict, CORS is credentialed to listed origins only | Kept; CORS now an exact-match allowlist (`CLIENT_ORIGIN` takes a list). Tests |
| Rate limits | Auth, chat and planner had limits; Stripe Checkout didn't | **Added**: 10 per 15 minutes per account |
| Headers | The API and the site sent none | **Added**: API (nosniff, no referrer, no framing, deny-all CSP, HSTS in production, no x-powered-by); site (CSP, nosniff, referrer, framing, permissions, HSTS on HTTPS). Tests |
| Secrets | Client build | Clean: no key patterns and none of the actual env values anywhere in `.next` |
| Input | Zod at every API boundary checked (chat 2,000 characters, UUID sessions, auth, CMS, settings) | Kept |
| RAG | Retrieval reads only the seeded public notes and published projects (`published: true`, public fields only); Gemini has first-token and total timeouts and model fallback; Voyage has timeouts; chat and planner are rate limited | Kept |
| Shopify | The token is Shopify's public Storefront token (meant for browsers); no timeout on its calls; raw errors shown on Buy now | **Fixed**: 8-second timeout, plain error |
| Reliability | `/health` said "ok" without a database; database routes hung 10 s then 500; SIGTERM didn't close the HTTP server | **Fixed**: health reports the database (`degraded`); 503 at once with Retry-After; graceful shutdown with a 10 s grace. Tests |
| Logs | Free-text console logs | **Added**: one JSON line per request in production (method, route with ids masked, status, time), no IPs, bodies, cookies or query strings. Module logs are unchanged (listed) |
| SEO | Titles, descriptions and canonicals unique per page; sitemap with projects and products; robots; JSON-LD Person and WebSite; OG image; real 404s; `metadataBase` from env | Kept, plus 404 pages titled "Page not found" and noindex; JSON-LD validity is now an e2e test |
| A11y | The assistant panel didn't keep focus while covering the page on phones | **Fixed**: focus trap, `aria-modal`, Escape and close return focus. e2e test |
| A11y | Footer social links didn't announce a new tab | **Fixed** |
| A11y | axe on nine pages and the open assistant, desktop and phone | No serious or critical issues |
| Performance | Stripe, admin and assistant-panel code on public pages | None; the Shopify client loads on shop pages only; the panel loads on intent |
| Cleanup | Root `package.json` (an accidental `mongodb` install) made Next guess the workspace root; unused Anthropic SDK and env keys; create-next-app README | Removed / replaced |

## Measurements

### Lighthouse

**Setup** (CLAUDE.md §6). 2026-11-20, on the development laptop (Windows 11,
i5-10310U; Lighthouse benchmark index about 1,470). Lighthouse 12.8.2 in
headless Chrome 157, performance, accessibility, SEO and best practices.

- **Builds:** before = the release base (`origin/main`, `2a82e5a`), built in a
  scratch copy; after = `release/polish`. Both `next build` and `next start`,
  with the same fixture API for projects (`NEXT_PUBLIC_API_URL` pointing at
  `client/e2e/mock-api`), `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, and
  the real Shopify development store's catalogue (read only).
- **Transport:** each build behind a local HTTP/2 proxy (self-signed
  certificate), as production hosts serve HTTP/2; `next start` alone is
  HTTP/1.1.
- **Mobile:** Lighthouse's default phone (412x823), simulated throttling
  (150 ms RTT, 1.6 Mbit/s) and a CPU slowdown of 1.2, the value PageSpeed
  Insights calibrates to; this laptop's 4x numbers swing too much to compare.
- **Desktop:** `--preset=desktop` (1350x940, 40 ms RTT, 10 Mbit/s), CPU 1.2.
- **Method:** three runs per route and build, before and after interleaved
  so machine load affects both alike; medians reported.
- **URLs:** `https://localhost:3444{route}` (before) and
  `https://localhost:3443{route}` (after).

Mobile (medians of 3):

| Route | Perf before | Perf after | LCP before | LCP after | TBT before | TBT after | CLS after |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 98 | 98 (99 on the final build) | 2.22 s | 2.27 s (2.19 s) | 31 ms | 24 ms | 0.001 |
| `/projects` | 99 | 100 | 1.94 s | 1.89 s | 35 ms | 22 ms | 0 |
| `/saas` | 99 | 99 | 2.08 s | 2.09 s | 37 ms | 43 ms | 0 |
| `/shop` | 94 | 94 (95 on the final build) | 3.08 s | 3.02 s (3.01 s) | 45 ms | 20 ms | 0 |

Desktop (medians of 3): 100 on all four routes before and after; LCP 0.47
to 0.77 s; CLS 0 to 0.001.

Accessibility, SEO and best practices: 100 on every route, both form
factors, before and after (best practices with the new CSP in place).

The final build (`30245c3`) was re-measured for `/shop` and `/` on mobile,
interleaved with the base again; those are the numbers in brackets.

**Targets.** Mobile 95+ is met for `/` (98 to 99) and `/projects` (100). LCP
is under 2.5 s on every route except `/shop`, CLS is 0 to 0.001, and TBT stays
under 50 ms. **`/shop` is 94 to 95**: its largest paint is a product photo
served from Shopify's CDN. Since `30245c3` that photo loads eagerly with
high priority (no load delay); what remains is the modelled connection to a
second origin plus the image (1.7 s of 3.0 s), about 0.6 s of server
response and 0.5 s of render delay. Proxying the photos through this site
would remove the extra connection but would put image processing on the
site's server; listed, not done. These are lab numbers on localhost, not
field data from real visitors.

### JavaScript per route

First load on a phone viewport, script transfer within 2.5 s of `load`
(includes prefetched route chunks), measured over HTTP/1.1 from `next start`:

| Route | Before | After |
| --- | --- | --- |
| `/`, `/projects`, a case study | 144.5 KB (10 files) | 144.8 KB |
| `/saas`, `/saas/signup` | 157.3 KB (14) | 157.8 KB |
| `/shop`, a product | 162.5 KB (13) | 162.9 KB |

No public route loads Stripe, admin or assistant-panel code; the Shopify
client loads only on shop pages. An intermediate build was 5 KB heavier on
every route; it was the new page headers repeated on every static file,
fixed in `5260b30`.

## Checks

| Check | Before (base) | After |
| --- | --- | --- |
| Client lint | pass | pass |
| Client types (`tsc --noEmit`) | pass | pass |
| Client unit tests | 33 pass | 37 pass |
| Client production build | pass (workspace-root warning) | pass, no warnings |
| Server lint | no linter | pass (ESLint added) |
| Server types | pass | pass |
| Server unit tests | 36 pass | 54 pass |
| Server build (`tsc`) | pass | pass |
| E2E (Playwright, desktop and Pixel 7) | 18 tests (home, pages) | 66 pass, 12 skipped by design (desktop-only and phone-only variants): journeys, axe, pages, screenshots |
| axe (serious and critical) | not run | none, nine pages and the assistant, both profiles |
| Screenshots, 375 / 768 / 1440 | | 27 full-page captures reviewed; no horizontal scroll at any width |
| Secrets in the client build | not checked | none |

## Commits

**Setup**
- `a8d49ec` chore: check out every text file with LF line endings

**Workstream 1: visual hierarchy**
- `d1feae0` feat(client): one peak per page and one accent per view
- `a56c13e` fix(client): terracotta only for actions in the planner and dashboards
- `fef1142` refactor(client): last one-off text sizes onto the scale

**Workstream 2: copy**
- `1f65eff` feat(client): sharper copy for clients across the site
- `3325f88` docs: CMS summaries and two case-study drafts to paste in the admin

**Workstream 3: production readiness**
- `975a541` fix(billing): process each Stripe event once, newest first
- `ae5eb4c` fix(billing): send Stripe Checkout back to the SaaS dashboard
- `75b0487` fix(saas): no second checkout while Stripe confirms a payment
- `2b75bcb` fix(auth): share the session cookie with the site's server in production
- `6f24a96` feat(server): hardening headers, request logs, health and clean shutdown
- `230ba6a` feat(client): security headers and a content security policy
- `5260b30` perf(client): page policies on pages only, not on every static file
- `c4c47cb` fix(shop): time out slow Shopify calls and show a plain checkout error
- `30245c3` perf(shop): load the first row's photos first
- `29866eb` fix(seo): 404 pages are titled "Page not found"
- `3ed3be2` fix(a11y): keep keyboard focus inside the open assistant
- `e0f5df0` test(e2e): journeys, axe and screenshots against local stand-ins
- `d0e1496` chore: env examples, a server Dockerfile and the Node version
- `12633b9` ci: lint and build the server too
- `055ddf0` chore: remove unused dependencies and the create-next-app README
- `92cce66` docs: README with local setup, deployment, Stripe and the vector index

## Not verified, and why

- **Docker image.** Docker is installed but its daemon wasn't running and
  no Node image was present; pulling one is a download I didn't make
  without asking. The Dockerfile follows the same commands CI runs.
- **Graceful shutdown.** Windows has no SIGTERM to send a Node process;
  verify on the host or in Docker (`docker stop`).
- **Real database paths.** No MongoDB was available (above). Sign-up,
  log-in, the CMS and the webhook store ran through tests and the fixture
  API, not through Mongoose against a database.
- **Stripe end to end.** Signed events are tested locally; no Checkout ran
  against Stripe test mode.
- **`COOKIE_DOMAIN` across real hosts.** Unit-tested; needs a deployment
  with the site and API on two hosts of one domain to confirm.
- **CI on GitHub.** Nothing was pushed, so the new CI jobs have only run
  locally (same commands).
- **Browsers other than Chromium.** The e2e suite runs Chromium only, as set
  up before this release.
- **Lighthouse on a real host.** Local numbers over an HTTP/2 proxy, not
  PageSpeed Insights on the deployed site.
- **The live dashboard's inner panels.** Seeing them needs an active
  subscription and real provider data; their headings were left as they
  were.

## Needs Biniyam

**Environment and accounts**
- Server values (`server/.env.example`): `MONGODB_URI`, `JWT_SECRET`,
  `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `GEMINI_API_KEY`, `VOYAGE_API_KEY`,
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`,
  `GITHUB_API_TOKEN`, `YOUTUBE_API_KEY`, and in production
  `NODE_ENV=production`, `CLIENT_ORIGIN`, `COOKIE_DOMAIN`, `TRUST_PROXY=1`.
- Client values (`client/.env.example`): `NEXT_PUBLIC_API_URL`,
  `NEXT_PUBLIC_SITE_URL`, the Shopify domain and public token, optionally
  `GITHUB_API_TOKEN`.
- Atlas: add the API host's IP (and your own) under Network Access; run
  `npm run seed:kb` once against the production database.
- Your local `server/.env` still lists `ANTHROPIC_API_KEY`,
  `OPENAI_API_KEY` and Shopify keys the API no longer reads: safe to
  delete.

**Domain and hosting**
- A domain, with the site on it (Vercel, root directory `client`) and the
  API on a subdomain (`api.`). README, "Deployment".
- An API host (any Node host, or the Dockerfile).

**Stripe live mode**
- A live recurring price, the live webhook endpoint with the four events,
  and the live keys. README, "Stripe webhook". Nothing here sets a price.

**Content**
- Paste [`docs/content-updates.md`](content-updates.md) into the admin.
- Real results for the case studies (traffic, sales, client outcomes),
  testimonials and pricing: none were invented, and the copy leaves room
  for them.

**Decisions left to you**
- The header's outlined "Plan your project" stays terracotta, so the home
  page's first screen shows the action twice. Make it neutral if you want
  exactly one terracotta element per view.
- `Claude outputs/ui-ux-pro-max.zip` is tracked in the repository. Keep it,
  move it out of the repo, or delete it.
- `feature/send-brief` (unpushed) needs your review and a rebase onto this
  branch.
- PR #12 (`feature/editorial-showcase`) is still open.
- Your local `main` is 25 commits behind GitHub's; `git fetch` and
  fast-forward it before branching from it.

**Deferred refactors**
- Revoke sessions server-side on logout (a token version per account), pin
  JWT verification to HS256, and require `JWT_SECRET` at start-up in
  production.
- Shared rate-limit and chat-session stores (Redis or MongoDB) before
  running more than one API instance; both are per-process today.
- Move the remaining module logs onto the JSON logger.
- After Checkout, poll for the webhook instead of asking for a refresh.
- A nonce-based CSP, if the pages ever become dynamic anyway.
- Shop photos through this site (or a CDN in front of both) to save phones
  the second connection behind `/shop`'s largest paint.

## Summary

1. `release/polish` is cut from `origin/main` (`2a82e5a`), which already held the redesign, Playwright and QA work; only the local `main` was stale.
2. One peak per page: the H1 leads (83px), the numerals are gone, one size per heading role with a `title` middle tier, ink on sand at 11.9:1, emphasis by weight.
3. Terracotta means action only: the launcher is Deep Teal; meter, legend, drawings and planner states use signal; navigation is 13px sans.
4. Hero scene: the front card fills 19% of the frame (was 11%) with 16px copy; the pinned section is 300vh, 46% of the page's scroll (was 52%).
5. All copy is applied; `PLANNER_NOTE` sits under every planner call to action; CMS summaries and two case-study drafts are in `docs/content-updates.md`.
6. Fixed: Stripe redeliveries and out-of-order events, Checkout return URLs, paid-only access, a second-checkout risk, host-only session cookies, 10-second database hangs, Shopify timeouts, the assistant's focus.
7. Added: a CORS allowlist, security headers and a CSP (pages stay static), a checkout rate limit, health with database state, graceful shutdown, JSON request logs, server lint, README, env examples, a Dockerfile.
8. Checks: lint, types, 37 client and 54 server unit tests, both builds and 66 e2e tests pass; axe finds nothing serious or critical; 27 screenshots reviewed; no secrets in the bundle.
9. Lighthouse mobile: `/` 98 to 99, `/projects` 100, `/saas` 99, `/shop` 94 to 95 (a Shopify CDN photo); desktop 100 on all four; no regression against the base, and JS is within 0.5 KB of it.
10. Nothing is pushed or deployed. The Docker image, a real database, Stripe test mode and cross-host cookies are unverified; env values, the domain, Stripe live mode and CMS content are listed under "Needs Biniyam".

Report: `docs/release-report.md`.
