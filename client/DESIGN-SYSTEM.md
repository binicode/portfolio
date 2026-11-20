# Design system

The source of truth for the frontend's visual language. Tokens live in
`src/app/globals.css`; this file explains the decisions behind them.

## Concept

A precise interface for a civil engineer who builds software, in two
glazed materials, a Deep Teal body on a Soft Sand field, with Burnt
Terracotta as the one action (see Color). The tight
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
  joined by a terracotta request path. See "Work" below.
- Inline SVG only, one `<path>` per layer, `vector-effect: non-scaling-stroke`
  for crisp hairlines. Styles live in `globals.css` (`.d-*` classes).
- Drawings are static. Animated SVG transforms cannot be composited and
  repaint the surrounding layer on every frame (measured: ~100 main-thread
  paints during load when the old hero drawing assembled itself). Move the
  HTML element that holds a drawing instead, as the orbit does.

## Color

Deep Teal and Soft Sand, from the owner's reference: two glazed bodies, one
teal and one sand, on a sand field, with the type inverted between them.
Burnt Terracotta is the one action.

**Proportion.** The reference measures about two thirds sand to one third
teal (scratchpad script: render, classify every pixel). Every screen keeps
that balance: sand is the field, teal is the concentrated body.

| Screen | Teal bodies | Teal share (1280px) |
| --- | --- | --- |
| Home | Header, the hero's stack frame, footer | 28% |
| Work, case study, shop | Header, footer | 34–38% |
| SaaS | Header, the Deep Teal hero band (the sand demo window sits in it), window bar, footer | 37% |
| Sign-in (SaaS) | The product aside beside the sand form | 51% (the reference's two halves) |
| Admin sign-in | Header bar | 9% |
| Dashboards | The rail (mobile: the top bar) beside the sand work area | 16–20% |

Sand is the default (`:root`), so any screen without a theme is the field;
teal is always applied on purpose (`theme-deep`, `theme-patina`,
`theme-ink`, `theme-ember`). The home hero's first screen is sand with the
headline in teal; the teal body arrives with the scroll, when the frame
zooms in to fill the stage.

| Token | Value | Role |
| --- | --- | --- |
| Teal lit | `#136f6e` | The key light on teal: gloss and rims only. Never text |
| Teal glow | `#0f6262` | The brightest teal any text sits on (centre of a body's light). On sand: `signal`, labels and links (5.1:1 or more) |
| Deep Teal | `#084c4c` | Bodies (`theme-patina`, `theme-ember`); the solid button on sand (sand text 8.1:1) |
| Teal deep / abyss | `#032c2c` / `#011b1b` | Header, rails, window bars (`theme-deep`); the deepest shade, in gradients only |
| Teal ink / card / raised | `#063d3d` / `#0c5858` / `#0d5a5a` | The assistant (`theme-ink`); cards on teal (glass at 66%); raised |
| Teal line / input | `#2a6b69` / `#86b0ac` | Hairlines on teal (decorative); control borders on teal (3:1 or more) |
| Sand field | `#efe4d4`, lit `#f7efe4` to `#e7d8c3` | The page, lit per section like the reference's backdrop |
| Sand body / lit / raised | `#f3e9da` / `#f7ecdc` / `#e9dcc8` | Cards on sand, lit in the middle; raised (hover, tracks) |
| Soft Sand | `#e7d4b9` | The solid button on teal (teal text 6.9:1) |
| Sand deep / shadow | `#cbb393` / `#b09675` | Hairlines and shade; rims only |
| Sand text / muted | `#ece1ce` / `#d9cdb8` | Type on teal: 5.5:1 / 4.5:1 at the lit centre |
| Teal ink / muted | `#062224` / `#3e5c59` | Type on sand: 11.9:1 / 5.2:1 at the field's darkest edge (8.3:1 / 3.7:1 on a sand rim). The gap between them (2.3:1) keeps primary and secondary text apart |
| Burnt Terracotta | `#d96b52` | **The action**: filled calls to action (ink text `#062224`, 4.9:1), the header's outlined call to action, selection |
| Terracotta light / hover | `#f2a28c` / `#e4826b` | Terracotta text and the focus ring, only on deep teal (4.8:1 or more); the hover fill |
| Sea glass | `#9fdfd2` | On teal: `signal` (4.7:1 or more): links, legend keys, meters, drawings |
| Rose / red | `#ffa8b2` / `#8f2424` | Errors on teal / on sand, never the terracotta hue |
| Chart muted | `#8db3b0` / `#7d705b` | Comparison marks on teal / on sand (3:1 or more) |

Rules:

- Inverted type: sand on teal, teal ink on sand. The promise in a headline
  (`emph`) is the same colour one weight heavier (600 against the
  headline's 500): emphasis never reads lighter than the words around it.
- Terracotta is the one thing to do, and only that: filled calls to action
  and the header's outlined one. Never decoration, never a glow, never a
  meter or a drawing. The assistant launcher is Deep Teal (`.launcher`), so
  a view's terracotta is its own call to action. Legend keys, the header's
  stripe meter, the orbit's centre line and the drawings' accent strokes
  are `signal`.
- Emphasis, not ornament: no added shapes, curves or motifs. The reference's
  interlocking form is not reproduced; its proportion, tone and light are.
- Charts: the series that matters in `signal`, the comparison in
  `chart-muted`. Status always carries an icon or word, never colour alone.
- In `RevealWords`, unread words start at 0.45 on teal and 0.6 on sand
  (4:1 for the ink at the field's edge), emphasis included, so the statement
  stays above 3:1 at every scroll position.
- Light, as in the reference (`globals.css`, "Semantic roles"):
  - A teal body is lit from the upper left: glow, Deep Teal through the
    middle, shade to the lower right (`--surface-lighting` on the teal
    themes). The brightest point under text is the glow, which is what the
    text ratios above are checked against.
  - The sand field is the reference's backdrop, per section: lighter in the
    middle, warmer at the edges.
  - A sand body (`.bg-card`) is lit toward the middle and shaded toward its
    corners; `--glass-surface` adds a gloss band along the top and a window
    reflection down the right edge, both inside the padding, where no text
    sits. Teal glass carries the same two at lower strength.
  - Edges (`--elevation-card`, `--elevation-pop`): a bright rim along the top
    and left (the softboxes), a darker rim along the bottom and right.
  - Shadows on the field are the reference's warm studio shadow (`#3a2e21`),
    never grey: under sand cards, under the hero frame, the assistant and
    the demo window, and where a teal section meets the sand.
  - The hero frame is the glossiest object: a gloss band, a right-edge
    reflection and a left rim light over its volume.
  - `.btn-glaze` on filled buttons: a reflection across the top half with a
    soft horizon, light pooled at the base, a lit rim.
  - Real blur only where content passes behind: the sticky header on screens
    64rem and wider is 90% deep teal with an 18px backdrop blur (7.5:1 or
    more with sand behind it). Phones, and `prefers-reduced-transparency`,
    keep it solid.
  - Hover is a step to a lighter fill, never an opacity fade. No frosted
    cards, no grain.
- The site frame is lit like the reference: teal at the upper left, through
  the shade, to sand at the lower right. It sits outside the content.

Components use semantic names only (`background`, `foreground`, `card`,
`raised`, `muted-foreground`, `dim`, `border`, `input`, `primary`,
`primary-hover`, `accent`, `signal`, `emph`, `ring`…). The raw palette
appears only in `globals.css` and in `opengraph-image.tsx` (ImageResponse
can't read CSS variables). Every teal theme restates the full role set, and
`theme-sand` restates the sand set, so a body keeps its own colours wherever
it sits.

Never use `text-muted` or `text-secondary` for text: `muted` and
`secondary` are surface colors.

Axe can't check text over gradients, so the lighting is kept within the
ratios above by construction, and the solid fallbacks are checked by axe.

## Type

- **Inter Tight** for everything readable: headlines at weight 500 with
  tight tracking (`-0.04em` at h1), body at 400. Self-hosted subset in
  `src/app/fonts/` (OFL licence alongside): Latin, weight 400–600, 27 KB,
  preloaded.
- **Geist Mono** for micro-type only, through the `label` utility:
  kickers, meta, captions, technology names, button text. Never navigation. ASCII subset, weight 400–500,
  9 KB, not preloaded.
- Both subsets are produced by `npm run fonts:subset`
  (`scripts/subset-fonts.mjs`). Using `font-bold` or characters outside the
  subsets will not render as intended — widen the ranges in that script.
- Numbers in data use `tabular-nums`.

Scale (all in `@theme`), largest first:

| Role | Token | Size |
| --- | --- | --- |
| Page title on a public page: the page's one peak | `text-h1` | 40–84px |
| Section title; the footer line; an app screen's title (sign-in, dashboard, settings, admin, product) | `text-h2` | 32–56px |
| Middle tier: a featured item, a closing call to action, a minor section, a statement beside a form | `text-title` | 24–40px |
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

Text fields (inputs, text areas, the assistant's message box) are
`text-base` on touch screens (`pointer-coarse:`), whatever their size with a
mouse: iOS Safari zooms the page into any focused field under 16px.

### Writing

Fewer words, each doing a job. The interface explains itself; text names
things and gives the one fact the interface can't show.

- Headlines: a claim in about six words or fewer ("Your product, built to
  hold up.", "Stars, subscribers, mentions. One dashboard.", "Try before you
  hire."). One supporting line at most, under ten words.
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
style. Use it for metadata, not for navigation, not for sentences, and not
as an eyebrow above every heading. Primary and footer navigation are
`text-caption font-medium` (13px sans) in the foreground colour, with a
`signal` underline on hover and on the current page. A terracotta `label` kicker is reserved for a
page's or section's identity (for example "Creator Dashboard").

Avoid: colouring words for effect (the only coloured words are the promise
in a leading headline, `emph`, see Color), numbered markers on content
that isn't a sequence.

## Calls to action

The site's job is to turn a visitor with an idea into a client. Every
call to action states what happens on click, and its colour says what kind
of action it is.

- **Accent (terracotta): work with me.** Plan your project, Plan a
  similar project/product/store. All open the
  assistant's planner (`OpenChatButton mode="discovery"`), which ends in a
  brief and "Send brief".
- **Primary (bone): the main action of a product flow.** Create an account,
  Buy now, Continue to checkout, Save, Log in on its form.
- **Secondary (outline): the alternative route** beside either: See the
  work, Log in, Message me on LinkedIn. Its border and text turn the signal colour
  on hover.
- Text links (`link` utility) for routes inside content: See all work, Try
  the assistant, Explore the dashboard, Browse the store. The signal colour
  underline.
- At most one accent and one primary per view. Pair a main action with one
  secondary, never three equal buttons.

Wording:

- Verb first and the outcome named: "Plan your project", "Continue to
  checkout", "Send brief", "Copy brief and message me". No "Learn more",
  "Submit", "Click here".
- A short line under a conversion CTA says what happens and how long it
  takes. For the planner it is always `PLANNER_NOTE` in `lib/site.ts` ("Free.
  2 minutes. You keep the brief."), word for word, wherever the planner
  opens. Payments say
  where checkout happens ("Secure checkout on Stripe"); never invent a price.
- Links that leave the site show ArrowUpRight and say "(opens in a new tab)"
  to screen readers. Buttons that open the assistant carry
  `aria-haspopup="dialog"`, and focus returns to them when it closes.

Where they sit (one contextual CTA where intent peaks, not on every block):

| Place | Call to action |
| --- | --- |
| Header (every page) | Plan your project (`.btn-bracket`); mobile menu adds Message me on LinkedIn |
| Home hero | Plan your project + See the work |
| Case study | Need something like this? Plan a similar project (type preselected from its stack) + Ask how it was built (question placed in the chat box). Sticky beside the write-up on desktop, after it on phones (`ProjectCta`) |
| SaaS page | Create an account (try it) + Plan a similar product (build one) |
| Shop | Plan a similar store, after the products |
| Footer (every page) | Plan your project + Message me on LinkedIn |
| Assistant, chat | Planning a project? card in the empty state; Plan it in 2 minutes bar after an answer |
| Assistant, brief | Send brief (name + email or LinkedIn, accent); Copy brief and message me on LinkedIn, Copy only, Ask a question first as text links. If sending fails, Copy brief and message me becomes the accent button |

`requestOpenChat(mode, { build, question })` (`chat-events.ts`) is the one
way in: `build` preselects the planner's first answer when nothing is in
progress, `question` places text in the chat box (never sent for the
visitor). The copy in "Copy brief and message me" is synchronous
(`lib/copy-text.ts`) so it completes before LinkedIn's tab takes focus.

Send brief posts to `POST /api/inquiries` (`lib/inquiry-client.ts`; pure
checks in `lib/inquiry.ts`). Two fields: Your name, and Email or LinkedIn
profile (one field, either accepted). Under the button, the privacy line:
"Only I see this, and only to reply to you. Deleted after 12 months." Sent
shows "Brief sent" and how the reply will come (by email / on LinkedIn); a
failure (including the 503 the server answers at once while its database is
down) or a rate limit (429) swaps the form for "Copy brief and message me",
with Try sending again after a failure. Inquiries land in the admin
dashboard's Inquiries page, whose counts (total, new, last 30 days) are the
planner's conversion measure; there is no third-party analytics. New
inquiries are marked in the signal colour (a status, not an action).

## Components

- Buttons (`components/ui/button-styles.ts`): rectangular (`rounded-xs`),
  mono uppercase text; variants accent, primary, secondary, ghost, danger
  and sizes sm, md, lg (see "Calls to action").
- `.btn-bracket`: the outlined terracotta button with corner brackets, used only
  for the header's Plan your project.
- `.stripe-meter`: the striped header bar in `signal`; its cover slides
  with page scroll (`scroll(root)`), so it doubles as a reading-progress
  meter.
- `.launcher`: the assistant's fixed button, Deep Teal with a sand rim so
  it stays visible over sand and teal alike.
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
  throughout"). A recessed well with a drafting dot grid (`.stack-map`); a
  request path from node to node that never crosses a label; the last
  node solid. Flow switches from rows to columns at a 34rem content width
  (container query). The map is a `figure` whose caption reads the whole
  architecture to screen readers; the drawing itself is `aria-hidden`.
- Each card has one primary link, the title, stretched over the card
  (`::after`, `z-[1]`, focus ring drawn inside the card because the card
  clips its edge); "Live site" and "Source" sit above it as separate links
  with accessible names. Hover lifts the card's edge, brightens the request
  path to full terracotta and slides the "Case study" arrow.
- The title and the map share view-transition names with the case study,
  whose header shows the same map, so both carry across the navigation.
- `LiveSystemsList` (the work page while the CMS has nothing published)
  uses the same maps, from each live system's `stack` in `lib/systems.ts`.
- Server-rendered HTML with inline SVG marks: no images, no client
  JavaScript.

## Creator Dashboard

- Frame: from `lg`, a 17rem sidebar (`DashboardSidebar`): product name and
  plan, the pages (Dashboard, Settings), the sources (each jumps to its
  section, or to Settings with "Not set" in terracotta when it isn't
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
  a wide feature tile, a step brighter with a signal-colour hairline
  (`.repo-feature`), and its share of all stars as a thin meter; then six
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
- Colour: one series per chart. Lines in `signal` over a flat 10% area;
  columns in the de-emphasis gray `--chart-muted` (3.4:1 or more on the
  card) with one `signal` column. Green and red are reserved for change
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
- Hover and focus: the card border and the title turn the signal colour; the photo
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
  terracotta rule), and the brief. If no first word arrives within 4 s (6 s for
  the brief), or the request fails, built-in text replaces it
  (`fallbackInsight`, `fallbackBrief`), so the flow never stalls.
- The brief is light markdown rendered as elements, never as HTML
  (`parseBrief`, rendered by `BriefText`, which the admin list reuses). Send
  brief ends the flow (see "Calls to action"); only then are the brief,
  answers, name and reply address stored on the server, for 12 months (a
  TTL index), with no IP address or user agent. Progress stays in
  localStorage, plus whether this brief was sent (not the name or address).
- Each step scrolls the visitor's latest answer to the top of the panel, so
  the recommendation and next question below it are read together. Focus
  moves to the selected or first option, or to the "Send it to me" heading
  above the form (no input is focused for the visitor, so phones don't
  raise the keyboard over the brief).
- Entry points: the panel's mode switch and the footer's "Plan your
  project", which call `requestOpenChat('discovery')`. Everything ships in
  the lazily loaded panel chunk (about 10 KB gzip, chat included), so no
  public page loads it up front.

## Layout

- `.site-frame`: the public site (and the 404 page) sits inside a
  frame, `--frame` wide (6px on phones, up to 18px on desktop), lit like
  the reference: teal at the upper left, through the shade, to sand at the
  lower right.
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

- Hero: `.hs` is 300vh (46% of the home page's scroll at 1440 by 900,
  down from 52% at 400vh) with a sticky stage and a named view timeline
  (`--hs`). Ranges are in `contain` percentages and must not overlap:
  intro out 0–9%; the frame is invisible until 9%, then zooms (scale
  0.55 → 1) and fades in until 24%; heading and legend 21–28%; the orbit
  turns from 24% to the end. All scroll-linked, CSS only, behind
  `@supports (animation-timeline: view())`; other browsers and reduced
  motion get the four layers as a static grid.
- The front card is the scene's subject: 27rem square at most (19% of the
  frame at 1440 by 900), its title `text-h3`, its line of copy 16px. Cards
  to the side and behind are dimmed (0.7 and 0.86) and set further back,
  so they read as context.
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
  Unread words start at 0.45 opacity (0.6 on sand) so the large statement
  text stays above 3:1 at every scroll position.
- Route changes: React `<ViewTransition>` (no config flag since Next 16.3).
- `CursorReadout`: fine pointers only, rAF-throttled. (The cursor-following
  glow, `PointerLight`, was removed with the gradients.)
- Animate `transform` and `opacity`. Keep `visibility` (needed to take
  faded controls out of the tab order) in its own animation, so the
  opacity/transform one can run on the compositor.
- When an element has more than one scroll-driven animation, write the
  longhands (`animation-name`, `animation-duration: auto`, …). The CSS
  minifier expands a multi-animation shorthand with `animation-duration: 0s`,
  which makes scroll-driven animations jump straight to their end state.
- All motion is disabled under `prefers-reduced-motion: reduce`.
- No blur filters. One `backdrop-filter`: the sticky header on wide screens (see Color, "Glass"), where content passes behind it.

## Performance rules

- Server Components by default. Client components today: `SiteNav`,
  `ChatLauncher` (panel lazy-loaded on intent), `OpenChatButton`,
  `CursorReadout`, `ShopifyImage`, forms,
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
