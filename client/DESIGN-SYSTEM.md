# Design system

The source of truth for the frontend's visual language. Tokens live in
`src/app/globals.css`; this file explains the decisions behind them.

## Concept

Weathering: a dark, precise interface for a civil engineer who builds
software, coloured like two materials that age well, Corten steel (rust)
and copper patina (verdigris), on petrol ink instead of black. The tight
grotesk headlines and the mono micro-labels follow the reference the owner
chose (an Awwwards product site with a pinned, scroll-driven hero). The
content and drawings stay specific to this portfolio: structures as a
metaphor for the stack.

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

Three colours, three jobs. Rust is the one action (start a project),
verdigris is where the eye should land, ink gives depth. Contrast ratios are
the worst case across every surface they sit on (checked by script for all
pairs, then by axe on every route).

| Token | Value | Role |
| --- | --- | --- |
| Ink deep | `#0b1215` | Deepest surface: hero stage, header, dashboard rail |
| Ink | `#10191e` | Page background |
| Ink card | `#16232a` | Cards (`card`) |
| Ink high | `#1d2d36` | Raised: hover, tracks, popovers, active segments (`raised`, `muted`) |
| Line | `#283a44` | Hairlines and dividers (decorative) |
| Input | `#6f8792` | Control borders (3.7:1, WCAG 1.4.11) |
| Patina / card / high / line | `#0d201f` / `#132c2a` / `#1a3835` / `#24453f` | The patina section theme |
| Ember | `#1b110d` | Under the footer's glow |
| Bone | `#ede7dc` | Text, primary buttons (10:1 or more) |
| Ash | `#a9b6bb` | Secondary text (6:1 or more) |
| Smoke | `#7f8f96` | Dim meta text only (`text-dim`, 4.8:1 or more) |
| Rust | `#e8642f` | **The action and the brand**: "start a project" calls to action, the launcher, the header (bracket button, nav underline, scroll meter), focus ring, selection, the site frame (4.8:1 as text on cards) |
| Rust bright | `#f47b4c` | Rust text on raised surfaces and over the rust gradients |
| Verdigris | `#62c2ab` | **Where the eye lands** (`signal`): the promise in a leading headline (`emph`), links and every non-primary hover, section labels, featured and high-value markers, the dashboard's data and the reader's name, live status, healthy state (`success`), status badges (5.9:1 or more) |
| Rose | `#ff7088` | Errors (`destructive`), a different hue from rust so an error never reads as the brand accent |
| Chart muted | `#6c7f88` | Comparison marks in charts (3.4:1 or more) |
| Rust deep / shadow, verdigris deep | `#8a3a1a` / `#5c2814`, `#1d4f46` | Gradient stops only; never text |

Rules:

- Rust is the one thing to do; verdigris is what to notice. A data series,
  a status, a label or a link is never rust; a filled button is never
  verdigris. In a hero or closing band they pair up: the promise in
  verdigris, the action under it in rust.
- Emphasis, not ornament: the accent lives in the content and its states,
  never in added shapes, lines or illustrations.
  - `emph` (on `<em>`) marks the promise in a leading headline: the few
    words that say what the reader gets. One phrase per headline, only in
    leading headlines: hero "to *hold up*", About "*applied to software*",
    SaaS hero "*in one place*", footer "needs to *hold up*". "Hold up"
    opens and closes every visit, and that echo is deliberate. The dashboard
    and its preview greet the reader with their name in `emph`.
  - Links (`link`): text keeps its colour, the underline is verdigris and
    fills in on hover. Secondary buttons, project cards (title and "Case
    study"), external links and inline actions turn verdigris on hover.
  - Labels that lead a section, and "Featured", are verdigris.
  - In `RevealWords`, emphasised words start brighter (0.6, not 0.45) so
    they stay above 3:1 while they reveal.
- Charts: the series that matters in `signal`, the comparison in
  `chart-muted`. Status always carries an icon or word, never colour alone.
- Depth comes from surface steps, not shadows alone: deep, page, card,
  raised. `.bg-card` and `.bg-raised` get the lit top edge and soft drop
  (`--elevation-card`) automatically; floating panels use `shadow-pop`.
- Section themes re-point the surfaces for everything inside them:
  `theme-deep` (hero, header, dashboard rail), `theme-ink` (page),
  `theme-patina` with `patina-glow` (Systems on the home page, the SaaS
  hero). The footer is ink into ember (`footer-glow`). `PointerLight`
  follows the section (`--glow`): rust by default, verdigris in patina.
- The site frame weathers from rust at the top of the screen to patina at
  the bottom; the hero frame from patina at the top to rust at the bottom.

Components use semantic names only (`background`, `foreground`, `card`,
`raised`, `muted-foreground`, `dim`, `border`, `input`, `primary`,
`accent`, `signal`, `ring`…). The raw palette appears only in
`globals.css` and in `opengraph-image.tsx` (ImageResponse can't read CSS
variables).

Never use `text-muted` or `text-secondary` for text: `muted` and
`secondary` are surface colors.

Text over gradients needs checking by hand (axe skips gradients): the hero
frame keeps its two rust stops dark enough for `accent-bright` legend keys
(4.6:1) and Ash (6:1); the footer glow keeps Ash above 6:1.

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

Avoid: colouring words for effect (the only coloured words are the promise
in a leading headline, `emph`, see Color), numbered markers on content
that isn't a sequence.

## Calls to action

The site's job is to turn a visitor with an idea into a client. Every
call to action states what happens on click, and its colour says what kind
of action it is.

- **Accent (rust): work with me.** Plan your project, Start a project, Plan a
  similar project/product/store, and the assistant launcher. All open the
  assistant's planner (`OpenChatButton mode="discovery"`), which ends in a
  brief and "Copy brief and message me".
- **Primary (bone): the main action of a product flow.** Create an account,
  Buy now, Continue to checkout, Save, Log in on its form.
- **Secondary (outline): the alternative route** beside either: See the
  work, Log in, Message me on LinkedIn. Its border and text turn verdigris
  on hover.
- Text links (`link` utility) for routes inside content: See all work, Try
  the assistant, Explore the dashboard, Browse the store. Verdigris
  underline.
- At most one accent and one primary per view. Pair a main action with one
  secondary, never three equal buttons.

Wording:

- Verb first and the outcome named: "Plan your project", "Continue to
  checkout", "Copy brief and message me". No "Learn more", "Submit", "Click
  here".
- A short line under a conversion CTA says what happens and how long it
  takes ("About 2 minutes. You get a project brief to keep."). Payments say
  where checkout happens ("Secure checkout on Stripe"); never invent a price.
- Links that leave the site show ArrowUpRight and say "(opens in a new tab)"
  to screen readers. Buttons that open the assistant carry
  `aria-haspopup="dialog"`, and focus returns to them when it closes.

Where they sit (one contextual CTA where intent peaks, not on every block):

| Place | Call to action |
| --- | --- |
| Header (every page) | Start a project (`.btn-bracket`); mobile menu adds Message me on LinkedIn |
| Home hero | Plan your project + See the work |
| Case study | Need something like this? Plan a similar project (type preselected from its stack) + Ask how it was built (question placed in the chat box). Sticky beside the write-up on desktop, after it on phones (`ProjectCta`) |
| SaaS page | Create an account (try it) + Plan a similar product (build one) |
| Shop | Plan a similar store, after the products |
| Footer (every page) | Plan your project + Message me on LinkedIn |
| Assistant, chat | Planning a project? card in the empty state; Plan it in 2 minutes bar after an answer |
| Assistant, brief | Copy brief and message me (copies, then opens LinkedIn), Copy only, Ask a question first |

`requestOpenChat(mode, { build, question })` (`chat-events.ts`) is the one
way in: `build` preselects the planner's first answer when nothing is in
progress, `question` places text in the chat box (never sent for the
visitor). The copy in "Copy brief and message me" is synchronous
(`lib/copy-text.ts`) so it completes before LinkedIn's tab takes focus.

## Components

- Buttons (`components/ui/button-styles.ts`): rectangular (`rounded-xs`),
  mono uppercase text; variants accent, primary, secondary, ghost, danger
  and sizes sm, md, lg (see "Calls to action").
- `.btn-bracket`: the outlined rust button with corner brackets, used only
  for the header's Start a project.
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

## Shop

A compact catalogue that belongs to the dark interface, not an embedded
Shopify page. The product photos are bright, white-backed studio shots;
the UI frames them instead of changing them.

- Photos are never cropped, tinted or blended: `object-contain` on a white
  plate (their own background) with a little inner padding, inset in a dark
  card (`bg-card`, border, `rounded-xl`, 8px inset). The bright area reads
  as a framed object, and is kept small by the grid.
- Grid (`ProductCard`): 2 columns on phones, 3 from `sm`, 4 from `lg`, 5
  from `xl` (15 products: 8, 5, 4, 3 rows). `sizes` follows those widths,
  so Shopify's CDN serves files that match (384px for a 1280px screen).
  Only the first photo loads eagerly with high priority.
- Card content: title (two lines, `min-h-[2lh]` so prices line up across a
  row), then the price in `signal`, the figure to notice. "From" when the
  variants' prices differ; a "Sold out" chip on the photo and a muted price
  when no variant can be bought (`lib/shop-display.ts`, tested). A product
  without a photo gets a quiet "No photo" plate, not a repeated title.
- Hover and focus: the card border and the title turn verdigris; the photo
  scales 4% inside its plate. The whole card is one link.
- A slim toolbar above the grid says what's there ("15 products", "Prices
  in USD"), so the space before the grid carries information.
- Product page: the same framed photo at 5 of 12 columns (about 430px)
  beside a sticky column with the title, the price in `signal`, Buy now
  (checkout on Shopify, unchanged) and the description at a readable
  measure.

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

- `.site-frame`: the public site (and the 404 page) sits inside a
  weathered frame, `--frame` wide (6px on phones, up to 18px on desktop),
  rust at the top of the screen through deep ink to patina at the bottom.
  The wrapper is padded by `--frame`; the frame is
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
