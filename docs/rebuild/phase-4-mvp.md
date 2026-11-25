# Rebuild Phase 4: complete the MVP (record)

- **Branch:** `rebuild/phase-4-mvp` (from `rebuild/phase-3-plan`)
- **Plan:** `docs/rebuild/phase-3-plan.md`, section 4
- **Status:** in progress; steps 4.1 to 4.5 done and merged; 4.6 in progress: the API runs on Render and the site on Netlify, both checked from outside (below); DNS, Resend and Stripe come next, then the end-to-end checks

## Progress

| Step | Status | Verified by |
| --- | --- | --- |
| 4.1.1 Merge PR #19 (enquiries) | Done | Lint, types, unit tests, builds |
| 4.1.2 Advisories inside current majors | Done | `npm audit`: client 0; server only Zod (fixed in 4.2) |
| 4.1.3 Remove the shop | Done | All checks; e2e 54 passed, 10 skipped by design |
| 4.1.4 Dead code, README collection name | Done | All checks |
| 4.2.1 Database-backed API tests | Done | In `npm test`; CI caches the MongoDB binary |
| 4.2.2 Express 5, `asyncHandler` dropped | Done | Full suite, including errors thrown in async handlers |
| 4.2.2 Mongoose 9 | Done | Full suite; no deprecation warnings |
| 4.2.2 Zod 4 | Done | Full suite; server `npm audit` 0 |
| 4.2.2 Stripe 23, API version pinned | Done | Full suite; a test ties the pin to the SDK |
| 4.2.2 @google/genai 3, client only with a key | Done | Full suite; no-key chat test |
| 4.2.2 TypeScript 6.0 (both packages) | Done | All checks in both packages |
| 4.2.2 `dotenv` replaced by Node's `--env-file-if-exists` | Done | tsx, tsx watch, node and `npm start` checked |
| Install-script policy | Done | Clean installs, all checks |
| CI dependency audit (high and above) | Done | Both packages at 0 |
| 4.3.1 `JWT_SECRET` required; HS256 only | Done | Unit tests: other algorithms, unsigned tokens, other secrets refused |
| 4.3.2 Audiences per sign-in context | Done | Unit and database tests; QA boundary suite run against a local MongoDB |
| 4.3.3 Revocable sessions (token version) | Done | Database tests: signing out revokes copied tokens, customer and admin |
| 4.3.4 Log-in: one bcrypt comparison whatever the email | Done | Database tests: unknown email and wrong password answer identically |
| 4.3.4 Sign-up answers the same for new and taken addresses | Done (4.4) | Database tests: same answer, the work happens after the response |
| 4.4.1 Email through Resend (HTTP API, no SDK) | Done | Unit tests (request shape, retries); sending itself needs the account (4.6) |
| 4.4.2 New-enquiry email to you | Done | Database test: alert sent, reply-to is the visitor |
| 4.4.3 Email confirmation; checkout needs it | Done | Database tests; e2e journeys |
| 4.4.4 Password reset (single-use, hashed, 30 minutes) | Done | Database tests; e2e journey |
| 4.4.5 Stripe customer portal | Done | Database test without a Stripe customer; the portal itself in 4.6 (needs Stripe) |
| 4.4.6 Account deletion | Done | Database tests (wrong password, Stripe unreachable keeps the account); e2e journey |
| 4.4.7 Privacy and terms pages | Drafted | Your review (see "Needs the user") |
| 4.5.1 Stripe customer created once (idempotency key) | Done | Database tests through the real SDK against a local stand-in for Stripe; the test fails without the key |
| 4.5.2 Pinned Gemini models, thinking set per model | Done | Database tests through the real SDK against a local stand-in: settings per model, fallback. Order provisional until measured with your key |
| 4.5.2 Daily AI cost cap with one alert | Done | Same suite: the cap stops calls; one alert email a day |
| 4.5.3 `voyage-4-lite` at 512 dimensions, model-filtered search | Done | Unit tests (request, index check); the live index and re-seed at deployment |
| 4.5.4 Dashboard sources cached 10 minutes | Done | Unit tests (expiry, failures not kept, shared loads, size limit) |
| 4.5.5 Timeouts on the site's server-side fetches | Done | Unit tests; production build; e2e |
| 4.5.6 Length limits: CMS fields and settings | Done | Database and unit tests |
| 4.5.7 Configuration errors, `/health`, one structured logger | Done | Database test (`/health` fields); sample production log lines checked |
| 4.5.8 Shared Open Graph base | Done | e2e: every public page has the site name, type, locale, URL and a working image |
| 4.6 Hosting configuration | Prepared | `netlify.toml`, `render.yaml` (valid against Render's schema), the keep-awake function, `docs/deploy.md`; the API's production-only install started and answered |
| 4.6 API deployed on Render (2026-11-25) | Checked from outside | `/health` reports the database connected; only the site's origin gets CORS; the hardening headers are sent; unsigned webhook 400; no session 401; unknown route 404 in JSON. Two defects found and fixed (findings 22, 23) |
| 4.6 Site deployed on Netlify (2026-11-25, `portfolio-dser.netlify.app`) | Checked from outside | Build log: Next.js adapter 5.16.9, published from `client/.next`, server handler and `keep-api-awake` packaged. Every public page 200; both dashboards 307 to their log-in without a session; source files and unknown paths 404; the content security policy and hardening headers sent; `robots.txt` disallows everything and pages say `noindex`; canonical and `og:url` point at `www.biniyam.com`; hashed assets cached a year, immutable. Not yet testable: anything that calls the API (finding 25) |
| Search engines kept out until launch | Done | `SITE_INDEXING`, off by default |

## Tests now

- **Server:** 145 tests, 45 of them against a real MongoDB (five suites, each with its own database; two also run the real Stripe and Gemini SDKs against local stand-ins): billing (checkout, portal, deletion at Stripe), the assistant's models and daily cost cap, sign-up through the emailed confirmation link (with the password), sign-up that reveals nothing about existing accounts and can't be used to take one over, password reset, the checkout gate for unconfirmed addresses, the billing portal guard, account deletion, enquiry alerts, log-in, sessions and their revocation, equal refusals for unknown emails, the sign-in rate limit, the admin and customer separation, the subscription gate, settings, the CMS draft-and-publish flow, http(s)-only project links, project briefs (store, list, mark read, delete, honeypot), the assistant without a model key, and the API running without Stripe.
- **Client:** 38 unit tests; e2e 80 passed (re-run after the 4.4 review fix: see below), 10 skipped by design (each skipped test belongs to the other viewport), now including the account journeys and the new pages' load and accessibility checks.
- **QA suite** (manual, `npm run test:qa`): its API-boundary file was run for 4.3 against a throwaway local MongoDB without provider keys: 8 passed; the Stripe webhook check answered 503 instead of 400, as designed when no Stripe key is set (that suite expects the keys from `server/.env`).

## Findings made during Phase 4

1. **The API could not start without Stripe configured.** `stripe.service.ts` created the client at import with an empty key, and the SDK (22 and 23) throws on that, so every start without `STRIPE_SECRET_KEY` crashed, although the README called billing optional. Fixed: the client is created on first use, only with a key; billing answers 503 without one.
2. **The Stripe API-version comment was wrong.** It said the account's default version applies; the SDK sends its own. The version is now pinned in code (`2026-11-18.endive`).
3. **A customer's cookie gets 401, not 403, on admin routes.** Admin routes read only the admin cookie, so a customer session there is simply no admin session. Correct; noted because the earlier tests only covered a customer token placed in the admin cookie (403).
4. **npm 11 blocks dependency install scripts by default.** Each package that has one is now explicitly denied; none is needed.
5. **The audit's count of empty server files was 14; it was 11.** Corrected in the audit and the plan.
6. **Changes in behaviour from 4.3**, deliberate:
   - A customer token sent to an admin route (or the reverse) now gets 401, not 403: it is no session of that kind at all.
   - Admin sign-in and `/api/admin/auth/me` need the database (the admin's token version lives there) and answer 503 without it. Logging out always works; without the database it only clears the cookie.
   - Every signed-in request reads the account's token version: one small database read per request.
   - Sign-up, both log-ins and registration share one rate-limit budget per address (unchanged), and the database tests use it exactly; the last test checks the 11th attempt is refused.
7. **Security review of 4.3** (`security-review`): no vulnerability at the reporting bar. Every route guarded before is still guarded; no route still uses the old guards. Acted on one observation below the bar: logging out with an already revoked copy of a token could sign out the sessions that came after it. Logout now revokes only for a current token, and the database tests cover it for both kinds. Left as they are: the rate-limit key does not check the token version (it is not a guard), and registering a taken address answers 409 (fixed with 4.4).
8. **Password changes bump the token version.** The 4.4 reset does (a reset signs out every device; tested). A change of `ADMIN_PASSWORD_HASH` should be followed by an admin sign-out, which bumps the admin's version.
9. **Sign-up no longer signs in.** To answer the same for new and taken addresses, sign-up returns 202 at once and works after the response; the confirmation link signs in. Unconfirmed accounts can't log in (finding 14). A taken address gets a note to its owner (at most hourly) instead of a 409.
10. **Database test files run in parallel**, so an email sent after the response can take seconds under load; the helper waits up to 15 s.
11. **Hosting research (2026-11-23), recorded in `docs/deploy.md`:**
    - Koyeb's sign-up selects its $29 Pro plan by default; the free instance comes with the pay-as-you-go Starter plan, which must be chosen.
    - Resend generates a domain's records when it is added; domains added since August 2026 may get `CNAME` records instead of `MX` and `TXT`.
    - With DNS outside Netlify, Netlify recommends a subdomain as the primary domain: the site's address is `www.biniyam.com`, and the bare domain redirects to it.
    - Netlify Free charges 15 of its 300 monthly credits per production deploy, and pauses every site when they run out: production deploys come from `main` only.
    - Koyeb appends the client's address as the last `X-Forwarded-For` entry and vouches for that one only: `TRUST_PROXY=1`.
12. **Search engines were to be kept out until launch (plan section 3), but nothing did that.** Added: `SITE_INDEXING`, off by default (two builds checked).
13. **Dependabot alerts are on.** The 26 open alerts are all on `main`; this branch has none (`npm audit`, development dependencies included, in both packages). They close when the rebuild is merged.
14. **Security review of 4.4: a pre-account takeover, fixed.**
    - **The problem:** anyone could sign up with another person's address and their own password, log in while the account was unconfirmed, and keep that session after the owner clicked the confirmation link (which signed them in), so both would share the account, its billing portal and its deletion.
    - **The fix:**
      - Unconfirmed accounts can't log in; the answer is the same as for a wrong password, which also closes a way to probe which addresses exist.
      - Confirming needs the link and the sign-up password, and ends older sessions.
      - Signing up again while unconfirmed replaces the pending password and sends a new link.
    - **Tests:** the attack itself is now a test.
    - **Also fixed:** two links for one purpose could briefly be live at once (now one write).
    - **Accepted, documented in `docs/deploy.md`:** Atlas open to all addresses (Koyeb has no fixed outgoing address), and DMARC `p=none` until sending is checked.
15. **Accounts created before 4.4 have no confirmed address**, so they can't log in until they reset their password (which confirms it). Only relevant if the old database is reused; `docs/deploy.md` starts a new one.
16. **The manual QA suite's SaaS file (`client/e2e/qa/saas.qa.ts`) still assumes sign-up signs in.** To update before it is next run: follow the confirmation link the API prints in development (its log is kept by `start-api.mjs`).
17. **Link previews had no image or site name on any public page (4.5.8).** Each page set its own `openGraph` for `og:url`, and Next.js replaces a layout's whole `openGraph` with a page's, so the shared image and site fields were lost; the built HTML had only title, description and URL. Every page now builds on one shared base.
18. **Gemini 4 Hydrogen thinks at "high" by default, and thinking counts towards the output limit**, which would have left the planner's 160-token note empty or cut answers short. Each model now has its thinking level and headroom set explicitly (4.5.2).
19. **A knowledge base embedded with another model would have matched badly without any error** (vectors from different models aren't comparable). Chunks now record their model and search filters on it (4.5.3).
20. **Koyeb stopped self-serve sign-ups on 2026-11-24** (it is joining Mistral; its site shows only a contact form), so the API moved to Render's free plan, the user's choice over Northflank's free Sandbox (always on, also $0).
    - Render's free instance sleeps after 15 minutes and takes about a minute to wake, longer than the site waits (10 s). A Netlify scheduled function requests `/health` every 10 minutes, which uses about 744 of the 750 free hours a month.
    - Render publishes each region's outgoing address ranges, so Atlas allows only those (and, while seeding, your own address) instead of every address.
    - `TRUST_PROXY=1` followed Render's guidance for Express; the deployed API showed it was wrong (finding 22).
21. **Security review of 4.5:** nothing at the reporting bar. Acted on its cheap improvements:
    - **Leaving visitors.** The chat and the planner never noticed a visitor leaving: they listened for the request's `close`, which Node emits once the body has been read. Every abandoned answer streamed to the end, at full cost. They now watch the response's `close`, and token usage is counted before each chunk is passed on, so the cost of a stopped answer is still recorded. Checked with a probe: the stream stops at the next chunk and its usage is recorded.
    - **Error logs** now mask ids in the route and leave the message's first line out of the stack.
22. **On Render, `TRUST_PROXY=1` made visitors share rate limits; the right value is 3** (measured on the deployed API, 2026-11-25).
    - **Symptom.** 41 requests from about ten different addresses (this environment's outgoing addresses, seen in Cloudflare's `/cdn-cgi/trace`) landed in only three `RateLimit-Remaining` counts. The API was counting by the address of one of Render's proxies. Once live, ten failed sign-ins by anyone would have blocked sign-in for everyone behind that proxy for 15 minutes.
    - **Measurement.** With `TRUST_PROXY=4`, requests whose last faked `X-Forwarded-For` entry changed each time each started a new count, and requests where only an earlier entry changed shared one. The API was reading one entry past the real visitor, so three proxies (Cloudflare, then Render's load balancers) append to the header. Render doesn't document this; a Render article reports that it appends the visitor's address and doesn't clear a caller's own entries, which is why the count must be exact.
    - **Fixed** in `render.yaml` (`3`), the env example, the README and `docs/deploy.md`, which now says how to recheck it.
    - **Checked with `3` deployed:** faked `X-Forwarded-For` entries, single or three deep, no longer start new counts, and 40 requests from 11 sending addresses made exactly 11 counts. To repeat on `api.biniyam.com` once its DNS exists.
23. **Malformed JSON got a 500, and was logged as a bug.** Errors from Express's body parser (malformed JSON, a body over the size limit) reached the error handler's catch-all. They now answer 400 or 413 with a fixed message that doesn't echo the input (unit tests, including that unexpected errors still answer a generic 500).
24. **The first Netlify deploy published `client/` as plain files** (build log, 2026-11-25). The build succeeded, but it said "Custom publish path detected: 'client'" and packaged only `keep-api-awake`. Netlify's Next.js adapter never ran: Netlify adds it by itself only when it detects Next.js while linking the repository, which it can't here (no `package.json` at the root). So no page was server-rendered, revalidation and the dashboards couldn't work, and the source files were published (the repository is public, so nothing secret).
    - **Fixed** in `netlify.toml`: `publish = ".next"` and the adapter (`@netlify/plugin-nextjs`, not pinned, as Netlify recommends). `netlify build --context production` (Netlify CLI 27.20.1) now logs "Using Next.js Runtime" and packages `___netlify-server-handler` beside `keep-api-awake`. Serving that build locally needs Deno, which this environment can't download, so the pages themselves are checked on the next deploy.
    - **Deploy Previews failed** for the same pull request: `netlify.toml` gave the public values (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`) to production only, and the build stops without them. They now apply to every context; previews cost no credits and stay private, so they stay on and check each pull request on Netlify. Both contexts build locally with the adapter.
    - **Changing `netlify.toml` alone doesn't start a build** (Netlify builds only when `client/` changed), so this fix needs a deploy started by hand. Noted in the file and `docs/deploy.md`.
    - **The project is private** (new Free projects start private). Public projects on Free show a "Powered by Netlify" badge, which may not be removable on that plan. Both are in `docs/deploy.md`, step 4.
25. **What the live site can't do until DNS exists** (checked 2026-11-25):
    - **The API is unreachable from the site.** The site calls `https://api.biniyam.com`, which has no DNS record yet, so sign-up, log-in, the assistant and enquiries can't work, and the home and projects pages show no projects. The new database also has no projects until they are added through the admin (`docs/content-updates.md`).
    - **Keep-awake fails until then** (it requests `api.biniyam.com/health`), so the API sleeps between visits.
    - **Only `www.biniyam.com` will work for accounts:** the API's CORS allows that origin alone, and the session cookies are `SameSite=Strict` for `biniyam.com`, so the `netlify.app` address can't sign anyone in.
    - **Netlify injects its "Powered by Netlify" badge** into every page (`/.netlify/scripts/hud?variant=public`, a 36 KB script) now that production is public. It is third-party branding and extra script on every page. Turning it off may need a paid plan (`docs/deploy.md`, step 4); the user decides.

## Needs the user

- **Netlify badge:** try turning it off (Project configuration > General > Powered by Netlify badge); if it is locked on Free, decide whether to keep it (finding 25).
- **Accounts and settings, `docs/deploy.md` steps 2 and 5:** Resend, the Stripe sandbox (Atlas, Render and Netlify are done). Secrets go into each host's settings, never into chat or git.
- **DNS at Namecheap, `docs/deploy.md` step 6.**
- **Review the privacy and terms drafts** (`/privacy`, `/terms`). Open decisions they leave out: refunds, governing law, and whether privacy requests should go to an email address instead of LinkedIn.
- ~~Pull requests for 4.1 to 4.5~~ merged ([binicode/portfolio#27](https://github.com/binicode/portfolio/pull/27), [binicode/portfolio#28](https://github.com/binicode/portfolio/pull/28), [binicode/portfolio#29](https://github.com/binicode/portfolio/pull/29)).
- **A Gemini API key for the model measurement** (4.5.2): entered through this session's secure form, never chat. Without it the provisional order stays (Flash-Lite first).
- ~~Hosting choice~~ Netlify Free + Render Free (Koyeb closed sign-ups on 2026-11-24). ~~DNS~~ Namecheap BasicDNS. ~~Dependabot alerts~~ on.
