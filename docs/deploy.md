# Deploying biniyam.com

Chosen 2026-11-23: **Netlify Free** for the site and **Koyeb Free** for the
API, at $0 a month. Checked against each provider's documentation that day.
Nothing here needs a paid plan; where a provider pushes one, the step says
so.

| Part | Where | Address |
| --- | --- | --- |
| Site (Next.js, `client/`) | Netlify Free | `https://www.biniyam.com` (the bare domain redirects there) |
| API (Express, `server/`) | Koyeb free instance, Washington, D.C. | `https://api.biniyam.com` |
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

**Koyeb's free instance (512 MB, 0.1 vCPU).**

- It sleeps after an hour without traffic, and the next request waits a few
  seconds while it wakes.
- Koyeb says it isn't meant for production; it fits this pre-launch stage.
- Sign-up needs a card. Koyeb places a $29 hold and releases it.
- **Sign-up selects the Pro plan ($29 a month) by default: choose Starter.**
  Starter is pay-as-you-go and includes the free instance, so nothing is
  charged. If Pro was selected, switch to Starter under **Usage and
  billing**.

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
3. **Network Access:** add `0.0.0.0/0`.
   - Koyeb's free instance has no fixed outgoing address, so a narrower list
     would block it.
   - What protects the database instead: the generated password, TLS (Atlas
     requires it) and the user's access to one database only.
4. **Connect > Drivers:** copy the connection string and put `/portfolio`
   before the `?`. This is `MONGODB_URI`, a secret.

### 2. Resend

1. **Domains > Add domain:** `mail.biniyam.com`, region `us-east-1`.
2. Keep the page open: its **Records** tab has the exact DNS records for step
   6. Domains added since August 2026 may show `CNAME` records instead of an
   `MX` and a `TXT`; add whatever is shown.
3. **API Keys > Create:** permission **Sending access**, for this domain
   only. This is `RESEND_API_KEY`, a secret.

### 3. Koyeb (the API)

1. Create the service from GitHub, with these settings:
   - **Repository:** `binicode/portfolio`, branch `main`.
   - **Builder:** Dockerfile. In the Builder section, turn on **Override**
     for **Work directory** and enter `server`. **Dockerfile:**
     `Dockerfile`.
   - **Instance:** Free. **Region:** Washington, D.C.
   - **Exposed port:** `4000`, HTTP, path `/`.
   - **Health check:** HTTP, path `/health`, port `4000`.
2. Add the variables below. Store each secret as a Koyeb **Secret** and
   reference it from the variable.
3. **Domains:** add `api.biniyam.com`. Koyeb shows the `CNAME` value for step
   6 (it looks like `<id>.cname.koyeb.app`).

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `MONGODB_URI` | secret, from Atlas |
| `CLIENT_ORIGIN` | `https://www.biniyam.com` |
| `COOKIE_DOMAIN` | `biniyam.com` |
| `TRUST_PROXY` | `1`. Koyeb appends the visitor's address as the last `X-Forwarded-For` entry, and that is the only one it vouches for. |
| `JWT_SECRET` | secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_EMAIL` | your admin sign-in address |
| `ADMIN_PASSWORD_HASH` | secret: the bcrypt hash command in `server/.env.example` |
| `RESEND_API_KEY` | secret, from Resend |
| `EMAIL_FROM` | `Biniyam <hello@mail.biniyam.com>` |
| `ALERT_EMAIL_TO` | the inbox that should receive new enquiries |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID` | secrets, from step 5 |
| `GEMINI_API_KEY`, `VOYAGE_API_KEY` | secrets, the AI assistant's keys |
| `AI_DAILY_COST_CAP_USD` | optional, default `1`: the most Gemini may cost per day (UTC) before the assistant pauses until midnight |
| `GITHUB_API_TOKEN`, `YOUTUBE_API_KEY` | secrets, the dashboard's data sources |

### 4. Netlify (the site)

1. **Add new project > Import from Git:** `binicode/portfolio`.
   - `netlify.toml` already sets the base directory (`client`), the build,
     Node 24 and the public variables.
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

### 6. DNS at Namecheap

**Domain List > Manage > Advanced DNS.**

**Before adding anything:**

- **Remove Namecheap's parking records:**
  - the `CNAME` for `www` (to `parkingpage.namecheap.com`);
  - the `URL Redirect` for `@`.

  Remove any other `A`, `AAAA`, `CNAME` or redirect record on `@`, `www` or
  `api` too: they would conflict.
- **Check Mail Settings.** If it is set to Email Forwarding or Gmail and you
  receive mail at `@biniyam.com`, switching it to **Custom MX** (needed only
  if Resend shows an `MX` record) replaces that setup. Add your existing mail
  `MX` records back as custom ones in the same step.

**Host Records.** Hosts are relative: Namecheap appends `biniyam.com` itself.

| Type | Host | Value | TTL | For |
| --- | --- | --- | --- | --- |
| ALIAS | `@` | `apex-loadbalancer.netlify.com` | 5 min | the bare domain, then redirected to `www` |
| CNAME | `www` | `<your Netlify project>.netlify.app` | Automatic | the site |
| CNAME | `api` | the value Koyeb shows | Automatic | the API |
| *as shown by Resend* | e.g. `send.mail`, `resend._domainkey.mail` | exactly as shown in Resend's **Records** tab | Automatic | sending email |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | Automatic | email authentication policy; add once Resend shows the domain as verified |

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

1. **Deploy.** Merge the rebuild into `main` through a pull request (you
   approve it). Koyeb and Netlify then both deploy.
2. **Load the knowledge base** once, from `server/` with that environment:
   `npm run seed:kb`.
3. **Check in a real browser** on `https://www.biniyam.com`:
   - `https://api.biniyam.com/health` answers `"database":"connected"`.
   - **Sign-up:** the confirmation email arrives from `mail.biniyam.com` and
     its link signs in.
   - **Password reset:** the link works once and signs out other sessions.
   - **Subscription:** Stripe test checkout (card `4242 4242 4242 4242`)
     unlocks the dashboard through the webhook; **Manage billing** opens the
     portal and cancelling there locks it again.
   - **Account deletion:** removes the Stripe customer.
   - **Enquiries:** a brief from the planner appears in the admin and as an
     email, and replying reaches the visitor.
   - **Assistant:** answers from the knowledge base.
   - **Rate limits:** the response headers of a sign-in attempt show limits
     per visitor, not shared by everyone (`TRUST_PROXY`).
   - **Search engines:** `robots.txt` disallows everything until launch.
4. Record the results in `docs/rebuild/phase-4-mvp.md`.

## Launch (end of Phase 5)

1. **Stripe:** switch to live keys, then create a live price, webhook and
   portal settings.
2. **Search engines:** set `SITE_INDEXING=on` in Netlify and redeploy.
3. **Search Console:** add the site.
4. **Backups:** consider Atlas Flex, about $30 a month at most, for daily
   snapshots once paying customers make them worth it.
