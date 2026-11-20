# Content updates for the CMS

The case studies live in MongoDB and are edited in the admin
(`/dashboard/projects`), so this release does not write them. Paste the text
below into each project's fields.

## Summaries

Paste into **Summary**.

| Project | Summary |
| --- | --- |
| Creator Analytics SaaS | A subscription SaaS, end to end: sign-up, Stripe billing, one dashboard for a creator's reach. |
| Portfolio AI Assistant | AI chat that answers from my own notes, cites its sources and streams as it writes. |
| Headless Shopify Storefront | A custom, server-rendered storefront on Shopify's catalogue and checkout. |
| Portfolio CMS | The admin behind this page: draft, edit and publish case studies. |

## Case-study bodies

Paste into **Case study**. The format is the one `client/src/lib/case-study.ts`
renders: one paragraph per line, `## ` headings and `- ` list items. Every
statement comes from the code in this repository; add real results (traffic,
sales, client outcomes) only where you have them.

### Headless Shopify Storefront

```text
## Problem
A Shopify theme decides how the store looks and how fast it loads. I wanted the catalogue on this site, in its own design, without rebuilding what Shopify already does well: products, inventory and payment.

## What I built
- A catalogue page and a page per product, rendered on the server from the Shopify Storefront API.
- Prices, "From" prices and sold-out states worked out from each product's variants.
- Buy now: one click creates a fresh Shopify cart and sends the visitor to Shopify's own checkout.

## Decisions
- Shopify keeps checkout. Payment, tax and fraud checks stay with the platform built for them.
- Pages are regenerated every five minutes, so a visitor gets prebuilt HTML instead of waiting on the API.
- No cart is stored between visits. Each Buy now starts a new cart, which keeps the demo simple and private.
- Product photos come from Shopify's image CDN at the width each screen needs. Only the first photo loads with high priority.
- The Storefront API version is pinned, so an upgrade is a deliberate change.

## Result
A storefront that looks like the rest of the site and hands payment to Shopify. It is live at /shop.
```

### Portfolio CMS

```text
## Problem
Case studies change as projects grow. Editing them in code means a deploy for every sentence, so the portfolio needed its own admin.

## What I built
- An admin sign-in, separate from the SaaS accounts, with its own role check on the server.
- Create, edit, publish and delete case studies: title, slug, summary, stack, live and repository links, and the body.
- A small plain-text format for the body: paragraphs, headings and lists. No HTML is ever interpreted.

## Decisions
- New projects start as drafts. Publishing is an explicit switch, never a side effect of saving.
- The public API returns published projects only, filtered in the database query.
- Every admin route sits behind one guard for the session and the admin role, so a new route can't be left open by mistake.
- Input is validated on the server, including the slug format.
- The session is an httpOnly, SameSite=Strict cookie, so page scripts can't read it.
- Public pages refresh from the API every minute, so an edit shows up without a deploy.

## Result
The work page, each case study and the assistant's project notes all read from this one source.
```
