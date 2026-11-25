# Deploying biniyam.com

**What runs where** (checked against each provider's documentation on
2026-11-23 and 2026-11-24):

- **Site:** Netlify Free.
- **API:** Render's free plan. It replaced Koyeb on 2026-11-24: Koyeb, joining
  Mistral, stopped self-serve sign-ups.

It all costs $0 a month and needs no card. Nothing here needs a paid plan;
where a provider pushes one, the step says so.

| Part | Where | Address |
| --- | --- | --- |
| Site (Next.js, `client/`) | Netlify Free | `https://www.biniyam.com` (the bare domain redirects there) |
| API (Express, `server/`) | Render free web service, Virginia (`render.yaml`) | `https://api.biniyam.com` |
| Database | MongoDB Atlas M0 (free), AWS N. Virginia (`us-east-1`) | — |
| Email | Resend Free, region `us-east-1` | sent from `mail.biniyam.com` |
| Payments | Stripe, test mode (a sandbox) until launch | — |

**Why these choices:**

- **`www` as the main address.** With DNS outside Netlify, Netlify recommends a
  subdomain as the primary domain: only a subdomain can point at its CDN
  directly.
- **`mail.` for email.** Resend recommends a subdomain, which keeps sending
  reputation apart from the main domain.
- **Everything in US East.** The API, the database and the email service sit
  next to each other, and close to the AI providers.
- **Same site for the API and the site.** The API is on `api.` of the same
  domain because the session cookies are `SameSite=Strict`, shared with
  `COOKIE_DOMAIN=biniyam.com`.

## Limits that matter on the free plans

**Netlify Free: 300 credits a month, a hard limit.**

- A production deploy costs 15 credits.
- Traffic costs 20 credits per GB of bandwidth, 2 per 10,000 requests, and
  10 per GB-hour of server rendering.
- When the credits run out, every site on the account is paused until the
  next month.
- To keep deploys rare, production builds only from `main` and only when
  `client/` changed (`netlify.toml`). Check usage under the team's
  **Billing** or **Usage** page.

**Render's free web service (512 MB, 0.1 CPU).**

- **Sleeping.** It sleeps after 15 minutes without traffic and takes about a
  minute to wake, longer than the site waits for it.
  - **Keep-awake:** a Netlify scheduled function
    (`client/netlify/functions/keep-api-awake.mjs`) requests `/health` every
    10 minutes, so it stays up.
  - **Hours:** that uses about 744 of the 750 free instance hours a month
    (they're shared by the workspace's free services), so run no other free
    web service in the same Render workspace.
- **Monthly allowances (Hobby workspace):** 5 GB of outbound bandwidth and 500
  build minutes. Without a card, using up the bandwidth suspends the service
  until next month instead of billing you. Render emails before a limit is
  reached.
- **Not for production.** Render says free instances aren't for production
  and may restart at any time; it fits this pre-launch stage. Keeping it
  always on at launch is Render's Starter plan, a paid choice for later.
- **No shell or one-off jobs:** run `npm run seed:kb` from your own machine
  (step 7).

**Atlas M0.** 0.5 GB of storage and no backups. Stripe stays the record of
payments, and enquiries are also emailed, so losing the database would cost
accounts and chat history, not billing state or enquiries.

**Resend Free.** 100 emails a day and 3,000 a month, counting enquiry alerts
and account email together.

## Order of setup

DNS is last: three of its values come from the accounts made before it.

### 1. MongoDB Atlas

1. Create a free **M0** cluster on AWS, region **N. Virginia (us-east-1)**.
2. **Database Access:** add a user with a generated password and
   **specific privileges** `readWrite` on the database `portfolio` only.
3. **Connect > Drivers:** copy the connection string and put `/portfolio`
   before the `?`. This is `MONGODB_URI`, a secret.
4. **Network Access:** filled in after step 3 (Render), from Render's own
   list of addresses. Until then nothing can connect, which is fine.

### 2. Resend

1. **Domains > Add domain:** `mail.biniyam.com`, region `us-east-1`.
2. Keep the page open: its **Records** tab has the exact DNS records for step
   6. Domains added since August 2026 may show `CNAME` records instead of an
   `MX` and a `TXT`; add whatever is shown.
3. **API Keys > Create:** permission **Sending access**, for this domain
   only. This is `RESEND_API_KEY`, a secret.

### 3. Render (the API)

1. Sign up at render.com (no card needed) and connect GitHub with access to
   `binicode/portfolio`.
2. **New > Blueprint**, choose `binicode/portfolio`. Render reads
   `render.yaml`, which sets everything about the service:
   - the free plan, region Virginia and the Docker build from `server/`;
   - the health check `/health`;
   - deploys from `main` only after its CI checks pass;
   - the domain `api.biniyam.com` and the non-secret variables;
   - a `JWT_SECRET` that Render generates itself.
3. **Secrets.** Render asks for each value marked `sync: false`; fill them in
   from the table below.
4. **DNS value.** After the first deploy, open the service: its `onrender.com`
   address (for example `biniyam-api.onrender.com`) is the `api` value in
   step 6.
5. **Let it reach the database.**
   - In the service, open **Connect > Outbound** and copy its IP ranges: the
     addresses Render's Virginia services send from.
   - In Atlas, add each range under **Network Access** (CIDR notation, as
     shown).
   - This is narrower than allowing every address. The ranges are shared by
     Render services in that region, so the database user's generated
     password, TLS and its access to one database still matter.
   - The API keeps retrying the database in the background, so it connects
     shortly after the list is saved; no redeploy is needed.
6. **Optional, later:** under the service's **Environment** you can add
   `GITHUB_API_TOKEN` and `YOUTUBE_API_KEY` (the dashboard's data sources) and
   `AI_DAILY_COST_CAP_USD` (default `1`: the most Gemini may cost per UTC day
   before the assistant pauses until midnight).

| Secret | Where it comes from |
| --- | --- |
| `MONGODB_URI` | Atlas, step 1 |
| `ADMIN_EMAIL` | your admin sign-in address |
| `ADMIN_PASSWORD_HASH` | the bcrypt hash command in `server/.env.example` |
| `ALERT_EMAIL_TO` | the inbox that should receive new enquiries |
| `RESEND_API_KEY` | Resend, step 2 |
| `GEMINI_API_KEY`, `VOYAGE_API_KEY` | the AI assistant's keys |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID` | Stripe, step 5 (add them once it's done) |

Set in `render.yaml` already:

- `NODE_ENV=production`;
- `CLIENT_ORIGIN=https://www.biniyam.com`;
- `COOKIE_DOMAIN=biniyam.com`;
- `EMAIL_FROM=Biniyam <hello@mail.biniyam.com>`;
- `TRUST_PROXY=3`: the number of proxies in front of the API on Render
  (Cloudflare, then Render's load balancers). Render doesn't document it;
  it was measured on the first deploy (step 7). With `1`, every visitor
  shared a few rate-limit counts.

Render sets `PORT` itself.

### 4. Netlify (the site)

1. **Add new project > Import from Git:** `binicode/portfolio`.
   - `netlify.toml` already sets the base directory (`client`), the build,
     the publish directory (`.next`), Netlify's Next.js adapter, Node 24 and
     the public variables. It overrides whatever the import screen fills in.
   - Check the first deploy's log: it must say **Using Next.js Runtime** and
     package `___netlify-server-handler`. Without the adapter, Netlify
     publishes the folder as plain files and no page is server-rendered.
   - Name the project `biniyam` if that name is free. Its address
     (`<name>.netlify.app`) is the `www` value in step 6.
2. **Project configuration > Build & deploy > Branches and deploy contexts:**
   - **Production branch:** `main`.
   - **Branch deploys:** None.
   - **Deploy Previews:** off.
3. **Environment variables** (optional): `GITHUB_API_TOKEN`, a token with no
   scopes, for the home page's GitHub list. Leave `SITE_INDEXING` unset until
   launch: the site then stays out of search engines.
4. **Domain management:** add `www.biniyam.com`. Netlify adds
   `biniyam.com` with it and redirects that to `www`. Netlify issues HTTPS
   certificates once DNS points at it.
5. **Functions:** after the first production deploy, `keep-api-awake` is
   listed with its schedule (every 10 minutes); **Run now** checks it.
6. **Visitor access.** New projects on the Free plan start private: only you,
   signed in to Netlify, can open them. To run the checks in step 7 from any
   device, set **Project configuration > General > Visitor access > Project
   visibility** to public for production and keep previews private. Search
   engines stay out either way until `SITE_INDEXING` is set.
7. **Badge.** Public projects created on the Free plan since 2026-08-19 show a
   "Powered by Netlify" badge in a corner of every page. Turn it off under
   **Project configuration > General > Powered by Netlify badge** if the plan
   allows it; on Free the setting may be locked.
8. **Changing `netlify.toml` alone doesn't start a build** (Netlify only builds
   when something under `client/` changed). After merging such a change,
   start one under **Deploys > Trigger deploy**.

### 5. Stripe (sandbox)

1. Create a product with a **recurring** price. Its id (`price_…`) is
   `STRIPE_PRO_PRICE_ID`.
2. **Webhooks > Add endpoint:**
   - **URL:** `https://api.biniyam.com/api/saas/billing/webhook`.
   - **API version:** `2026-11-18.endive` (the version the code pins).
   - **Events:** `checkout.session.completed`,
     `customer.subscription.created`, `customer.subscription.updated`,
     `customer.subscription.deleted`.
   - The endpoint's signing secret is `STRIPE_WEBHOOK_SECRET`.
3. **Customer portal settings** (`dashboard.stripe.com/settings/billing/portal`,
   in the sandbox): allow updating payment methods, viewing invoices and
   cancelling subscriptions, then save.
4. The sandbox's secret key is `STRIPE_SECRET_KEY`.
5. Add the three Stripe values to the Render service's **Environment**.

### 6. DNS at Namecheap

**Domain List > Manage > Advanced DNS.**

**Before adding anything:**

- **Remove Namecheap's parking records:**
  - the `CNAME` for `www` (to `parkingpage.namecheap.com`);
  - the `URL Redirect` for `@`.

  Remove any other `A`, `AAAA`, `CNAME` or redirect record on `@`, `www` or
  `api` too: they would conflict, and neither Netlify nor Render supports
  IPv6 (`AAAA`).
- **Check Mail Settings.** If it is set to Email Forwarding or Gmail and you
  receive mail at `@biniyam.com`, switching it to **Custom MX** (needed only
  if Resend shows an `MX` record) replaces that setup. Add your existing mail
  `MX` records back as custom ones in the same step.

**Host Records.** Hosts are relative: Namecheap appends `biniyam.com` itself.

| Type | Host | Value | TTL | For |
| --- | --- | --- | --- | --- |
| ALIAS | `@` | `apex-loadbalancer.netlify.com` | 5 min | the bare domain, then redirected to `www` |
| CNAME | `www` | `<your Netlify project>.netlify.app` | Automatic | the site |
| CNAME | `api` | `<your Render service>.onrender.com` | Automatic | the API |
| *as shown by Resend* | e.g. `send.mail`, `resend._domainkey.mail` | exactly as shown in Resend's **Records** tab | Automatic | sending email |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | Automatic | email authentication policy; add once Resend shows the domain as verified |

**Verifying the domains.** Then, in Render, open the service's **Settings >
Custom Domains** and click **Verify** next to `api.biniyam.com`: Render
issues its HTTPS certificate.

**Resend's records, typed into Namecheap:**

- **Hosts.** Resend shows full names such as `send.mail.biniyam.com`; type
  only the part before `biniyam.com`, here `send.mail`.
- **If Resend shows an `MX` record:**
  - set **Mail Settings** to **Custom MX**;
  - add the record there with host `send.mail`;
  - Namecheap's unlabelled column after the value is the priority (use the
    one shown, usually 10).
- **If Resend shows `CNAME` records:** add them as `CNAME`s under Host
  Records instead.
- **Then** click **Verify DNS Records** in Resend.

**Timing.** Records usually work within 30 minutes; Netlify and Resend allow
up to a day or three. `dig +short www.biniyam.com CNAME` (and so on) shows
what the world sees.

`p=none` only reports. Move to `p=quarantine` once every email from the
domain passes DMARC (Resend's guide). No `rua` reporting address is set,
because it would publish an inbox in DNS; add one later if you want the
reports.

### 7. First deploy and checks (plan step 4.6)

1. **Deploy.** Merge the open rebuild work into `main` through a pull request
   (you approve it). Render deploys once CI passes; Netlify builds when
   `client/` changed.
2. **Load the knowledge base** once, from `server/` on your own machine (Render's
   free plan has no shell). In Atlas, **Network Access > Add current IP
   address** first (remove it afterwards). Put `MONGODB_URI` and
   `VOYAGE_API_KEY` in `server/.env` (never committed), then:

   ```bash
   npm ci
   ```

   ```bash
   npm run seed:kb
   ```

   Until then the assistant answers from the whole built-in knowledge base,
   matched by keyword instead of meaning.
3. **Check in a real browser** on `https://www.biniyam.com`:
   - `https://api.biniyam.com/health` answers `"database":"connected"`.
   - **Sign-up:** the confirmation email arrives from `mail.biniyam.com`, and
     its link with your password signs in.
   - **Password reset:** the link works once and signs out other sessions.
   - **Subscription:** Stripe test checkout (card `4242 4242 4242 4242`)
     unlocks the dashboard through the webhook; **Manage billing** opens the
     portal and cancelling there locks it again.
   - **Account deletion:** removes the Stripe customer.
   - **Enquiries:** a brief from the planner appears in the admin and as an
     email, and replying reaches the visitor.
   - **Assistant:** answers from the knowledge base.
   - **Rate limits** count per visitor (`TRUST_PROXY`). Recheck this whenever
     Render changes its network, with `curl -sI` on
     `https://api.biniyam.com/health`, reading `RateLimit-Remaining`:
     - **Not too high:** send `-H "X-Forwarded-For: 198.18.0.N"` with a new
       `N` each time. The count must keep falling. If it starts again at 299
       each time, callers can fake their address: lower `TRUST_PROXY`.
     - **Not too low:** from two networks (say, your phone on mobile data and
       your computer), each gets its own count. One shared count means
       visitors share limits: raise `TRUST_PROXY`.
     - **Finding the number** (how 3 was found): set `TRUST_PROXY` to 4 for a
       moment and send `X-Forwarded-For: 198.19.0.1, 198.19.0.2, 198.18.0.N`
       with a new `N` each time. If every request starts a new count, the
       API is reading the last of your three entries, one hop too far, so
       the right value is 3. If the count keeps falling, vary the middle
       entry instead: a new count each time means 2. Then set the result.
   - **Keep-awake:** after 20 quiet minutes the API still answers at once.
   - **Search engines:** `robots.txt` disallows everything until launch.
4. Record the results in `docs/rebuild/phase-4-mvp.md`.

## Launch (end of Phase 5)

1. **Stripe:** switch to live keys, then create a live price, webhook and
   portal settings.
2. **Search engines:** set `SITE_INDEXING=on` in Netlify and redeploy.
3. **Search Console:** add the site.
4. **Always-on API:** consider Render's paid Starter instance (a paid choice,
   yours to make) instead of the free instance kept awake.
5. **Backups:** consider Atlas Flex, about $30 a month at most, for daily
   snapshots once paying customers make them worth it.
