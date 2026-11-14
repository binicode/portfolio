# Design system

The source of truth for the frontend's visual language. Tokens live in
`src/app/globals.css`; this file explains the decisions behind them.

## Concept

Charcoal and rust: a dark, precise interface for a civil engineer who
builds software. The palette, the tight grotesk headlines and the mono
micro-labels follow the reference the owner chose (an Awwwards product
site with a pinned, scroll-driven hero). The content and drawings stay
specific to this portfolio: structures as a metaphor for the stack.

Spend boldness in one place per page. On the home page that is the hero:
a pinned scene where the headline clears away, a frame zooms in, and the
four layers of the stack orbit a fixed centre line, each coming to the
front in turn as you scroll. Everything around it stays quiet.

Hero copy is written for prospective clients: one headline, one line on
what the work is, two actions. No name or job-title chip (the header
carries the name), and no filler.

## Drawings

- `components/home/tech-stack/illustrations/`: one drawing per layer
  (`InterfaceIllustration`, `ApiIllustration`, `DataIllustration`,
  `ServicesIllustration`) on a shared 320×160 sheet (`ArtSheet`) with
  registration crosses: a page plan with one component bracketed, a request
  through two checkpoints to a route, stacked disks with a nearest-neighbour
  search, and providers wired to the API with a webhook back. They replace
  the building-section drawing but keep its drafting language, which is the
  civil-to-software link.
- Projects are not illustrated with structural drawings any more (the old
  truss, arch and cantilever plates said nothing about the software). Each
  project is drawn as the system it is: `components/work/StackMap.tsx`
  places its CMS tech stack on the same four layers (Interface, API, Data,
  Services; `lib/stack-layers.ts`, tested) with real technology marks,
  joined by a rust request path. See "Work" below.
- Inline SVG only, one `<path>` per layer, `vector-effect: non-scaling-stroke`
  for crisp hairlines. Styles live in `globals.css` (`.d-*` classes).
- Drawings are static. Animated SVG transforms cannot be composited and
  repaint the surrounding layer on every frame (measured: ~100 main-thread
  paints during load when the old hero drawing assembled itself). Move the
  HTML element that holds a drawing instead, as the orbit does.

## Color

| Token | Value | Role |
| --- | --- | --- |
| Charcoal 950 | `#0c0c0d` | Page background |
| Charcoal 900 / 850 | `#141315` / `#1c1b1e` | Cards, panels, muted surfaces |
| Line | `#29282c` | Hairlines and dividers (decorative) |
| Bone | `#e4e3e4` | Text, primary buttons (15:1) |
| Ash | `#a3a2a4` | Secondary text (7.4:1) |
| Smoke | `#7d7c7e` | Dim meta text only (`text-dim`, 4.7:1) |
| Rust | `#dd5226` | The single accent: active states, kickers, focus ring, launcher (4.9:1) |
| Rust deep / shadow | `#873417` / `#5f2814` | Gradient stops only (hero frame, footer glow); never text |

Components use semantic names only (`background`, `foreground`, `card`,
`muted-foreground`, `dim`, `border`, `input`, `primary`, `accent`, `ring`…).

Never use `text-muted` or `text-secondary` for text: `muted` and
`secondary` are surface colors.

Text over the rust gradients needs checking by hand (axe skips gradients):
small accent text there uses `accent-bright` (`--rust-bright`, #f47b4c) and
secondary text stays Ash, both at 4.5:1 or better over the deepest stop.

## Type

- **Inter Tight** for everything readable: headlines at weight 500 with
  tight tracking (`-0.04em` at h1), body at 400. Self-hosted subset in
  `src/app/fonts/` (OFL licence alongside): Latin, weight 400–600, 27 KB,
  preloaded.
- **Geist Mono** for micro-type only, through the `label` utility: nav,
  kickers, meta, captions, button text. ASCII subset, weight 400–500,
  9 KB, not preloaded.
- Both subsets are produced by `npm run fonts:subset`
  (`scripts/subset-fonts.mjs`). Using `font-bold` or characters outside the
  subsets will not render as intended — widen the ranges in that script.
- Numbers in data use `tabular-nums`.

Scale (all in `@theme`), largest first:

| Role | Token | Size |
| --- | --- | --- |
| Hero, about numerals | `text-display`, `text-stat` | fluid, up to 112–128px |
| Page title | `text-h1` | 40–84px |
| Section title, featured project | `text-h2` | 32–56px |
| Large reading text | `text-statement` | 24–40px |
| Card and page subtitles, greeting | `text-title` | 24–40px |
| Card title | `text-h3` | 22px |
| Intro line | `text-lead` | 18–22px |
| Summaries, card headings | `text-body-lg` | 17px |
| Body | `text-base` | 16px / 1.6 |
| Secondary body, lists, links | `text-body-sm` | 15px |
| Compact UI | `text-sm` | 14px |
| Captions, chips | `text-caption` | 13px |
| Meta, hints | `text-xs` | 12px |
| Mono labels, axis ticks | `text-micro` (= `label`) | 11px |
| Card figures | `text-figure-sm` / `-md` / `-lg` | 26 / 32 / 40px |

No one-off sizes (`text-[…rem]`): pick the step for the role, or add a
named step here. Headings use `text-wrap: balance`.

### Writing

Fewer words, each doing a job. The interface explains itself; text names
things and gives the one fact the interface can't show.

- Headlines: a claim in five words or fewer ("Software engineered to hold
  up.", "Your reach, in one place."). One supporting line at most, under
  ten words.
- Don't restate what the layout already says: no paragraph under a heading
  that repeats it, no subtitle that lists what the cards show.
- Lists and steps: a title plus a fragment ("Subscribe" / "Stripe
  Checkout."), not a sentence each.
- States: what happened and what to do, in one line ("GitHub didn't
  respond. Refresh to retry.", "Couldn't refresh. Try again."). No
  apologies, no "this is usually temporary".
- Hints only where a mistake is likely ("Starts with UC. Not your
  @handle."). Labels and placeholders carry the rest.
- Metadata descriptions are for search results and may run longer.

`label` (uppercase mono, 11px, +0.04em) is the system's one all-caps
style. Use it for navigation and metadata, not for sentences, and not as
an eyebrow above every heading. A rust `label` kicker is reserved for a
page's or section's identity (for example "Creator Dashboard").

Avoid: accenting one word in a headline, numbered markers on content
that isn't a sequence.

## Components

- Buttons (`components/ui/button-styles.ts`): rectangular (`rounded-xs`),
  mono uppercase text. Primary is Bone on Charcoal.
- `.btn-bracket`: the outlined rust button with corner brackets, used only
  for Contact (header and mobile menu).
- `.stripe-meter`: the striped header bar; its cover slides with page
  scroll (`scroll(root)`), so it doubles as a reading-progress meter.
- `HeroSystem` + `TechnologyStackOrbit` (server components, no client
  JavaScript): the pinned hero. Data for the four layers lives once in
  `tech-stack/stack.ts`; `StackCard` renders a layer (key, drawing, marks
  with names, one line of copy); `StackLegend` is the decorative progress
  row whose accent bar follows the scroll. Scroll is the only control, so
  there are no tabs; all four layers stay in the DOM, in order, for
  assistive tech.
- `TechLogo`: brand marks, monochrome (`currentColor`) so they stay in the
  palette, always beside the written name. Path data is unmodified from
  Simple Icons 16.37.0 (CC0) and, for Voyage AI, its own site header (the
  leaf mark). Generated from the source SVGs; don't hand-edit.
- `CursorReadout` (client): X/Y coordinates, fine pointers only, decorative.
- `RevealWords`: splits a statement into words that brighten as they cross
  the viewport (scroll-driven, no JavaScript after render).

## Work

- `ProjectShowcase` (home "Selected work", reached from the hero's "See the
  work", and the `/projects` index): a composed showcase, not identical
  rows. The newest project is a wide feature card: eyebrow and a large
  title on the left, summary and links on the right, and its architecture
  running the full width beneath (`StackMap layout="flow"`). The rest are
  compact cards, two or three to a row (an odd last card takes the full
  row at two columns): map on top (`layout="lanes"`, common minimum height
  so titles line up), then year, title, a three-line summary and links.
- `StackMap`: the project's technologies on Interface → API → Data →
  Services, with real marks (`TechLogo`), a plain "where it runs" line per
  layer in the wide flow, and languages on their own line ("TypeScript
  throughout"). A dot grid with a faint rust glow (`.stack-map`); a rust
  request path from node to node that never crosses a label; the last
  node solid. Flow switches from rows to columns at a 34rem content width
  (container query). The map is a `figure` whose caption reads the whole
  architecture to screen readers; the drawing itself is `aria-hidden`.
- Each card has one primary link, the title, stretched over the card
  (`::after`, `z-[1]`, focus ring drawn inside the card because the card
  clips its edge); "Live site" and "Source" sit above it as separate links
  with accessible names. Hover lifts the card's edge, brightens the request
  path to full rust and slides the "Case study" arrow.
- The title and the map share view-transition names with the case study,
  whose header shows the same map, so both carry across the navigation.
- `LiveSystemsList` (the work page while the CMS has nothing published)
  uses the same maps, from each live system's `stack` in `lib/systems.ts`.
- Server-rendered HTML with inline SVG marks: no images, no client
  JavaScript.

## Creator Dashboard

- Frame: from `lg`, a 17rem sidebar (`DashboardSidebar`): product name and
  plan, the pages (Dashboard, Settings), the sources (each jumps to its
  section, or to Settings with "Not set" in rust when it isn't
  configured), a link back to the portfolio, and the account with Log out.
  Below `lg` the sidebar is hidden and the compact top bar (`SaasNav`)
  carries the same pages and account. Only the page links (current-page
  state) and Log out are client components; icons are rendered on the
  server and passed in as elements.
- Page: a greeting ("Welcome back, {GitHub handle or email name}") with one
  line on source health from `sourceSummary`, Refresh on the right. Then
  three bands of different weight, so the page has a rhythm rather than a
  row of identical boxes:
  1. Stat rail (`StatRail`): five audience figures in one slim band,
     separated by hairlines (a 1px grid gap over the border colour),
     wrapping 2 → 3 → 5 columns. Typography carries it; the only graphic
     is the repositories' status bar.
  2. Two feature cards (`FeatureTrends`, 7 / 5): each a large headline
     number with its context and change pill, then the chart that explains
     it (mentions per week as a line, views per video as columns). The
     number and its chart share a card, so neither repeats elsewhere.
  3. Repository showcase (8) beside a narrow rail (4) with the account
     card and the recent-activity timeline; below `@5xl` the showcase goes
     full width and the rail's two cards sit side by side.
  No search box, notifications or "create" button: the product has none of
  those, so the layout doesn't pretend to.
- Grids use container queries (`@container`, `@md:`, `@3xl:`, `@5xl:`), not
  viewport breakpoints, because the same body renders beside the sidebar,
  inside the `/saas` demo window and (rail and features) in a 7-column slot
  on the home page. Charts thin their date labels by their own width.
- Change pills (`DeltaPill`) appear only where there is a real earlier
  value (this week vs the week before; the newest four videos' average
  views vs the four before): green up / red down with a triangle and the
  words "up", "down" or "unchanged" for screen readers. A missing source
  shows "—" and what to connect.
- Trend charts (`TrendLine`, `TrendColumns`): server-rendered SVG/HTML with
  three gridlines at round values (`niceMax`: 21 → 30, 6,120 → 8,000), a
  dot per real point (latest larger) or one accent column (newest upload)
  among gray ones. The feature cards use a short plot (`height`).
  Interactive through `ChartFrame`, a small client island: focusable
  `role="group"`; arrow keys, Home and End step through values, Escape
  clears, and a polite live region reads each one.
- Repository showcase (`RepoShowcase`, `showcaseRepos`): a curated
  portfolio, not a table. The creator's own live work only (no forks,
  archived or never-pushed repositories), most stars first. The top one is
  a wide feature tile with a faint rust glow (`.repo-feature`, a cheap
  gradient, no blur) and its share of all stars as a thin meter; then six
  compact tiles (four on phones): name, two-line description, language,
  stars and forks. No borders: a quiet fill that lifts on hover while an
  arrow slides in (`.repo-tile`). Server-rendered, no client JavaScript.
- Side rail: the account card (identity, plan, "Sources live" as three
  segments, one next step) and the activity timeline (`ActivityFeed`,
  `recentActivity`: pushes, uploads and mentions newest first, icons joined
  by a thin rule).
- The arithmetic (momentum, week over week, activity, showcase choice,
  summary, axis tops, initials) lives in `insights.ts` and `format.ts`,
  pure and unit-tested (`npm test`).
- `DashboardBody` renders it with a `variant`: `live` (real stats, links
  out) and `demo` (`DashboardPreview` on `/saas` and the locked dashboard:
  `sample-stats.ts`, chart readouts work, no external links or Refresh, CTA
  to sign up). One component, so the demo cannot drift from the product.
- The home page shows `DashboardPoster`: the stat rail and the two features
  (side by side from `@xl`) in the shared `PreviewWindow` chrome, `inert`,
  linking to the demo. It must not import `DashboardBody`: Next ships the
  chunks of every client component a page's server modules import,
  rendered or not (that once cost the home page 3.6 KB gzip). For the same
  reason the charts receive `ChartFrame` as a `Frame` prop instead of
  importing it.
- Colour: one series per chart. Lines in the accent over a fading accent
  wash; columns in the de-emphasis gray `--chart-muted` (#6f6e72, 3.7:1 on
  the card) with one accent column. Green and red are reserved for change
  and status, always with a shape and a word. Small secondary text on cards
  uses `--muted-foreground`; `--dim` is only for the sidebar's darker
  ground (on the card it falls just under 4.5:1).
- Readouts (`.chart-tip`) put the value first, then the context. Hover and
  keyboard share one state: a slot shows its readout (and the column
  brightens, or the line's crosshair appears) on `:hover` or
  `[data-active]`.
- Micro-interactions are CSS only (`@layer components` in `globals.css`):
  readouts rise 3px and fade in, cards' borders lift on hover and
  focus-within, sidebar rows and repository tiles fill on hover. Reduced
  motion keeps the state changes and drops the movement.
- Loading and refresh: the greeting renders at once and the numbers stream
  in behind `DashboardSkeleton`, an in-page `<Suspense>` with the same bands
  and container queries and the cards' rendered heights, so the swap
  doesn't jump. Refresh is a server action (`refresh()` from `next/cache`):
  its response carries the new tree, so "Refreshing…" ends exactly when new
  numbers are on screen, and a network failure says so inline. If the stats
  API itself fails, `saas/dashboard/error.tsx` keeps the dashboard frame
  and offers Try again (`retry`). Next 16.2 left refreshed Suspense content
  uncommitted about half the time (vercel/next.js#86055); fixed from 16.3.
- Repository status comes from GitHub's archived flag and last push:
  Active (30 days), Quiet (6 months), Dormant (older).

## Project discovery

The assistant panel has two modes: Ask a question (RAG chat) and Plan a
project. Planning is multiple choice first: a prospective client picks
answers, and the assistant adds technical advice between questions and
writes a brief at the end.

- Questions are fixed data in `lib/discovery/flow.ts` (pure and tested),
  not generated, so each one appears instantly and its options are always
  valid. Each later question can depend on earlier answers: a stack question
  only for existing apps, launch priorities only when more than three
  actions are picked, action options that match the product type, no "AI
  features" option for an AI product.
- One question per message. Single choice answers on click; multiple choice
  uses check tiles and Continue, with an optional limit ("Pick up to 3").
  Other opens a short text box. Not sure is a dashed chip beside it, and
  Skip sits in the footer next to Back and the progress bar ("3 of 8").
- Earlier answers are buttons: tapping one reopens that question. Later
  questions are asked again (their options can depend on it), with
  still-valid earlier picks preselected, so going back through them takes
  one tap each.
- The AI writes two things, through `POST /ai-chat/discovery`, which is
  stateless and rate-limited with chat. It adds a one-sentence
  recommendation after the stage and integrations answers (shown with a
  rust rule), and the brief. If no first word arrives within 4 s (6 s for
  the brief), or the request fails, built-in text replaces it
  (`fallbackInsight`, `fallbackBrief`), so the flow never stalls.
- The brief is light markdown rendered as elements, never as HTML
  (`parseBrief`). Copy brief and Message me on LinkedIn end the flow; no
  answers are stored on the server. Progress stays in localStorage.
- Each step scrolls the visitor's latest answer to the top of the panel, so
  the recommendation and next question below it are read together. Focus
  moves to the selected or first option, or to Copy brief.
- Entry points: the panel's mode switch and the footer's "Plan your
  project", which call `requestOpenChat('discovery')`. Everything ships in
  the lazily loaded panel chunk (about 10 KB gzip, chat included), so no
  public page loads it up front.

## Layout

- `.site-frame`: the public site (and the 404 page) sits inside a rust
  frame, `--frame` wide (6px on phones, up to 18px on desktop), rust at the
  top fading to near-black. The wrapper is padded by `--frame`; the frame is
  a fixed, pointer-transparent `::after` overlay. Anything sticky or fixed
  adds `var(--frame)` to its offset (header, hero stage, mobile menu, chat
  launcher and panel, sticky sidebars). Dashboards and sign-in pages are
  not framed: the space matters more there.
- `container-page`: max 84rem with fluid gutters (`--gutter`).
- `py-section` / `pb-section`: fluid vertical rhythm (`--section`).
- A 12-column grid at `lg`; content left-aligned. Section headings usually
  take 4–5 columns with content starting at column 6. The hero is centred.
- Lists of things (projects, steps, notes) are ledgers: rows separated by
  hairlines, not grids of identical cards.

Radii are small and follow hierarchy: controls `rounded-xs` (2px), panels
and frames `rounded-md`–`rounded-xl` (4–8px). Shadows only on floating
elements (chat launcher and panel).

## Motion

One orchestrated moment per page; no time-based entrance animations on load.

- Hero: `.hs` is 400vh with a sticky stage and a named view timeline
  (`--hs`). Ranges are in `contain` percentages and must not overlap:
  intro out 0–9%; the frame is invisible until 9%, then zooms (scale
  0.55 → 1) and fades in until 24%; heading and legend 21–28%; the orbit
  turns from 24% to the end. All scroll-linked, CSS only, behind
  `@supports (animation-timeline: view())`; other browsers and reduced
  motion get the four layers as a static grid.
- Stack orbit: per layer, a 16% dwell then a 12% turn. Keyframes are
  generated from one pose table (front, left, back, right, with arc
  midpoints), so the four cards can't drift out of step. From `md` up the
  stage is a real 3D context (`perspective` + `preserve-3d` + `translateZ`),
  so the browser depth-sorts the cards; cards stay opaque and recede by a
  darkening scrim, never by transparency, so nothing shows through. Phones
  get a flat fade-through, one card at a time. Every animated property is
  `transform` or `opacity`, and the front pose is the identity transform,
  so text there is rasterised sharp.
- `reveal` and `RevealWords`: scroll-driven (`animation-timeline: view()`).
  Unread words start at 0.45 opacity so the large statement text stays
  above 3:1 at every scroll position.
- Route changes: React `<ViewTransition>` (no config flag since Next 16.3).
- `PointerLight` and `CursorReadout`: fine pointers only, rAF-throttled.
- Animate `transform` and `opacity`. Keep `visibility` (needed to take
  faded controls out of the tab order) in its own animation, so the
  opacity/transform one can run on the compositor.
- When an element has more than one scroll-driven animation, write the
  longhands (`animation-name`, `animation-duration: auto`, …). The CSS
  minifier expands a multi-animation shorthand with `animation-duration: 0s`,
  which makes scroll-driven animations jump straight to their end state.
- All motion is disabled under `prefers-reduced-motion: reduce`.
- No blur filters or `backdrop-filter`.

## Performance rules

- Server Components by default. Client components today: `SiteNav`,
  `ChatLauncher` (panel lazy-loaded on intent), `OpenChatButton`,
  `PointerLight`, `CursorReadout`, `ShopifyImage`, forms,
  the dashboard's page links and Log out (`DashboardNavLinks`,
  `LogoutButton`), and its `ChartFrame` and `RefreshControl` (on `/saas`
  and the dashboard only, never the home page).
- No animation, 3D or UI libraries. `lucide-react` icons only.
- `src/lib/config.ts` must stay dependency-free: it is imported by browser
  code. (A schema library there previously added ~64 KB to every page.)
- Images through `next/image` with real `sizes`; the first row eager with
  `fetchPriority="high"`, everything else lazy.
- `experimental.inlineCss` was measured and rejected: on Next 16.2 it
  embedded the stylesheet about three times per page (HTML grew from ~12 KB
  to ~42 KB gzipped). Re-measure before enabling it on a future version.
- Fonts: one preloaded file (Inter Tight, 27 KB) plus Geist Mono (9 KB) on
  first use. Adding a family, weight or range needs a measured reason.
- Measure over HTTP/2: `next start` serves HTTP/1.1, which Lighthouse models
  with six connections per origin and penalises Next's many small chunks.
  Production hosts serve HTTP/2, so local numbers need an HTTP/2 proxy in
  front of `next start` to be representative.

## Case-study format

The CMS stores plain text. `src/lib/case-study.ts` renders:
one paragraph per line, `## Heading`, `### Subheading`, and `- list item`.
No HTML is interpreted.
