# Design system

The source of truth for the frontend's visual language. Tokens live in
`src/app/globals.css`; this file explains the decisions behind them.

## Concept

Two layers, after the presentation board the owner chose as the reference:

- **The canvas** is the portfolio (home, work, case studies): a light grey
  board, petrol-ink type, the name and each project title at poster size in
  a serif, lots of air. It has no colour of its own.
- **The windows** are the products. Each project hangs on the board as a
  large rounded window showing the real website (a screenshot of the live
  page), with a long soft shadow. The colour lives here: the products keep
  the dark "Weathering" material (petrol ink, rust, verdigris), and clicking
  through to the SaaS or the shop enters that material for real.

Each project is a **plate**: its name, its window, and a foot row with the
plate's numeral and a long arrow to the next plate. The arrows chain the
plates (01 to 02 to 03, then on to all work or the contact plate), which is
the board's project-to-project navigation.

Spend boldness in one place: the type scale and the windows. Everything
else (header, captions, footer) stays small and quiet.

Rules the owner set for this direction, which apply everywhere:

- No badge or eyebrow above a headline. The numeral sits in the foot row.
- No scroll-in or entrance animation. Motion only answers the reader.
- No opacity fades on button hover: hover is a solid colour step (to rust).
- No serif italics or single coloured words in canvas headlines.
- No icon set in the canvas parts: arrows are drawn for the site (`Arrow.tsx`).
- No coloured-border cards, glass, gradients or grain.
- No em dashes in interface copy; use a comma, colon or full stop.

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
| Ember / line | `#1b110d` / `#40291e` | The footer's surface (`theme-ember`) and its warm hairline |
| Bone | `#ede7dc` | Text, primary buttons (10:1 or more) |
| Ash | `#a9b6bb` | Secondary text (6:1 or more) |
| Smoke | `#7f8f96` | Dim meta text only (`text-dim`, 4.8:1 or more) |
| Rust | `#e8642f` | **The action and the brand**: "start a project" calls to action, the launcher, the header (bracket button, nav underline, scroll meter), focus ring, selection, the site frame (4.8:1 as text on cards) |
| Rust bright | `#f47b4c` | Rust text on raised surfaces (the hero legend keys) |
| Verdigris | `#62c2ab` | **Where the eye lands** (`signal`): the promise in a leading headline (`emph`), links and every non-primary hover, section labels, featured and high-value markers, the dashboard's data and the reader's name, live status, healthy state (`success`), status badges (5.9:1 or more) |
| Rose | `#ff7088` | Errors (`destructive`), a different hue from rust so an error never reads as the brand accent |
| Chart muted | `#6c7f88` | Comparison marks in charts (3.4:1 or more) |
| Rust deep / shadow, verdigris deep | `#8a3a1a` / `#5c2814`, `#1d4f46` | Stops of the site frame only; never text |

Rules:

### Canvas (portfolio pages)

A page opts in with a `.canvas-page` wrapper; the tokens are set on
`<body>` with `:has()`, so the shared header and footer turn with the
page, the site frame folds away (`--frame: 0`), and `color-scheme` and the
browser theme colour go light. Every dark theme class restates the full dark
role set, so a dark island inside the canvas (the assistant, a window's
architecture map) stays dark.

| Token | Value | Role |
| --- | --- | --- |
| Canvas | `#ebebe9` | The board (`background`) |
| Canvas raised | `#f5f5f3` | Cards (`card`), text on ink pills |
| Canvas step | `#d7d8d6` | `muted`, `raised` |
| Canvas line | `#cdcecc` | Hairlines |
| Ink deep | `#0b1215` | Text (15.8:1) and the solid pill |
| Muted text | `#565d61` | Secondary text, the plate numerals (5.6:1) |
| Dim | `#6b7276` | Large text only (4.1:1) |
| Rust, canvas | `#b2451a` / hover `#9a3b14` | Action: pill hover, focus ring, selection (4.7:1; white on it 5.6:1) |
| Verdigris, canvas | `#1c6b5c` | Link underlines and link hover (5.3:1) |
| Input | `#7c8488` | Control borders (3.2:1) |

On the canvas, colour is earned by interaction: type is ink, a button is
ink until you point at it (then rust), a link's underline is verdigris.

### Rules (both layers)

- Rust is the one thing to do; verdigris is what to notice. A data series,
  a status, a label or a link is never rust; a filled button is never
  verdigris. In a hero or closing band they pair up: the promise in
  verdigris, the action under it in rust.
- Emphasis, not ornament: the accent lives in the content and its states,
  never in added shapes, lines or illustrations.
  - `emph` (on `<em>`) marks the promise in a product's leading headline
    (SaaS hero "*in one place*"); the dashboard greets the reader with
    their name in it. Never on the canvas.
  - Links (`link`): text keeps its colour, the underline is verdigris and
    fills in on hover. Secondary buttons, project cards (title and "Case
    study"), external links and inline actions turn verdigris on hover.
  - Labels that lead a product section are verdigris.
- Charts: the series that matters in `signal`, the comparison in
  `chart-muted`. Status always carries an icon or word, never colour alone.
- Solid colour, about 90/10. Depth comes from surface steps, hairlines,
  spacing and type, never from glows or washes:
  - Surface steps: deep, page, card, raised. Each layer is one step above
    the one it sits on. `.bg-card` and `.bg-raised` get the lit top edge and soft
    drop (`--elevation-card`) automatically; floating panels use
    `shadow-pop`. Recessed wells (`.stack-map`) go one step down instead.
  - Materials: section themes re-point the surfaces for everything inside
    them, with a hairline in the material's own line colour at each edge:
    `theme-deep` (dashboard rail, the case-study architecture window),
    `theme-ink` (page, the assistant panel), `theme-patina` (the SaaS
    hero, the sign-in panel; `border-y`/`border-b`), `theme-ember`.
  - Marked items (the featured repository) get a brighter surface and a
    verdigris hairline, not a glow.
  - Charts: a flat 10% area under a line, not a fade.
- The justified 10%: the site frame around the product pages, rust at the
  top of the screen through deep ink to patina at the bottom. It sits
  outside the content and is the only decorative gradient; the canvas has
  none. The stack-map dot grid is drawn with a gradient function but reads
  as solid dots. Anything else needs the same justification before it ships.

Components use semantic names only (`background`, `foreground`, `card`,
`raised`, `muted-foreground`, `dim`, `border`, `input`, `primary`,
`accent`, `signal`, `ring`…). The raw palette appears only in
`globals.css` and in `opengraph-image.tsx` (ImageResponse can't read CSS
variables).

Never use `text-muted` or `text-secondary` for text: `muted` and
`secondary` are surface colors.

With solid surfaces, axe checks every text pair directly (it can't over
gradients).

## Type

- **Playfair Display 700** for the canvas's display type only: the name in
  the home hero, plate titles, the case-study title, the About and contact
  statements (`font-display`, `text-mega` / `text-poster`). Its licence
  reserves the font name, so the file is Google Fonts' own static latin
  weight-700 file, unmodified (23 KB, licence alongside). Declared in
  `lib/display-font.ts` and imported only by canvas pages, so only they
  preload it; anywhere else `font-display` falls back to the grotesk. No
  italics.
- **Hanken Grotesk** for everything else: headings, body, UI, and the light
  (300) plate numerals. Self-hosted latin subset, weight 300–600, 28 KB,
  preloaded.
- **Geist Mono** for product micro-type only (`label`: the dashboard, the
  SaaS and shop pages). Not used on the canvas. ASCII subset, 9 KB, not
  preloaded.
- Files are produced by `npm run fonts:subset` (`scripts/subset-fonts.mjs`;
  pass family names to regenerate only those).
- Numbers in data use `tabular-nums`.

Scale (all in `@theme`), largest first:

| Role | Token | Size |
| --- | --- | --- |
| Name, plate titles (serif) | `text-mega` | 52–168px |
| Long titles, statements (serif) | `text-poster` | 40–100px |
| Product heroes | `text-display`, `text-h1` | up to 112 / 84px |
| Section title | `text-h2` | 32–56px |
| Plate numerals | `text-numeral` | 32–44px, weight 300 |
| Large reading text | `text-statement` | 24–40px |
| Card and page subtitles, greeting | `text-title` | 24–40px |
| Card title | `text-h3` | 22px |
| Intro line | `text-lead` | 18–22px |
| Summaries, captions under windows | `text-body-lg` | 17px |
| Body | `text-base` | 16px / 1.6 |
| Secondary body, lists, links | `text-body-sm` | 15px |
| Compact UI | `text-sm` | 14px |
| Captions, chips | `text-caption` | 13px |
| Meta, hints | `text-xs` | 12px |
| Mono labels, axis ticks (products) | `text-micro` (= `label`) | 11px |
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

`label` (uppercase mono, 11px, +0.04em) is the products' one all-caps
style, for metadata inside the dashboard, the SaaS page and the shop. The
canvas has no all-caps text and no eyebrows.

Avoid: colouring words for effect (the only coloured words are the promise
in a leading headline, `emph`, see Color), numbered markers on content
that isn't a sequence.

## Calls to action

The site's job is to turn a visitor with an idea into a client. Every
call to action states what happens on click.

- **The pill** (`PillParts` + `pillClasses`, `components/ui/PillAction.tsx`):
  the reference's button, a rounded pill with the words and a round arrow
  beside it, both halves one control. Solid is ink on the canvas and bone in
  the products; hover steps both halves to rust and turns the arrow 45°.
  Outline is the alternative route. Used for every "work with me" action
  (Plan your project, Start a project, Plan a similar project) and for
  Message me on LinkedIn. All of these open the assistant's planner
  (`OpenChatButton mode="discovery"`), which ends in a brief.
- **Product buttons** (`button-styles.ts`, rectangular, mono uppercase)
  stay inside the products: Create an account, Buy now, Save, Log in.
- **Text links** (`link`) for routes inside content: See the work, Explore
  the dashboard, Read the case study. Verdigris underline.
- At most one solid pill per view, with one alternative beside it.

Wording:

- Verb first and the outcome named: "Plan your project", "Continue to
  checkout", "Copy brief and message me". No "Learn more", "Submit", "Click
  here".
- A short line under a conversion CTA says what happens and how long it
  takes ("About 2 minutes. You get a project brief to keep."). Payments say
  where checkout happens; never invent a price.
- Links that leave the site show `ArrowOut` and say "(opens in a new tab)"
  to screen readers. Buttons that open the assistant carry
  `aria-haspopup="dialog"`, and focus returns to them when it closes.

Where they sit:

| Place | Call to action |
| --- | --- |
| Header (every page) | Start a project (small solid pill); mobile menu adds Message me on LinkedIn |
| Home hero | Plan your project + See the work |
| Plates | The product's own action (Explore the dashboard, Browse the store, Try the assistant) and Read the case study, in the caption |
| Contact plate (end of every canvas page) | Plan your project + Message me on LinkedIn |
| Case study | Plan a similar project (type preselected from its stack) + Ask how it was built (`ProjectCta`) |
| SaaS page | Create an account (try it) + Plan a similar product (build one) |
| Shop | Plan a similar store, after the products |
| Assistant | The launcher pill on every page; the planning card in the chat's empty state |

`requestOpenChat(mode, { build, question })` (`chat-events.ts`) is the one
way in: `build` preselects the planner's first answer when nothing is in
progress, `question` places text in the chat box (never sent for the
visitor).

## Components

- `SiteHeader` / `SiteNav`: the name on the left, four words of navigation
  and the Start a project pill on the right; not sticky. It takes the page's
  material. The mobile menu is a native popover.
- `SiteFooter`: one quiet row (name, links, ©). Each page owns its closing
  call to action (canvas pages end on `ContactPlate`).
- `Arrow.tsx`: the site's own arrows, `ArrowLong` (plate navigation, back
  link) and `ArrowOut` (pills, links that leave the site). Hairline,
  `currentColor`, `aria-hidden`. Use these in canvas parts, not an icon set.
- `PillParts`: see "Calls to action".
- `TechLogo` (`components/work`): brand marks, monochrome, always beside the
  written name. Path data unmodified from Simple Icons 16.37.0 (CC0) and, for
  Voyage AI, its own site header. Generated from the source SVGs; don't
  hand-edit.
- The assistant launcher: a pill, fixed bottom right on every page.

## Plates

`components/work/Plate.tsx` composes one project like the reference board:

1. The title, centred, `font-display` at `text-mega` (`text-poster` for
   titles over 12 characters, which may take two lines).
2. The window (`.plate-frame`): rounded (16–32px), `ink-deep` until the
   image arrives, one long soft shadow, `aspect-ratio` reserved so nothing
   shifts. From 48rem it shows the desktop screenshot (1440×1024 view); on
   phones a portrait 4:5 window shows the phone layout (art direction with
   `<picture>` and `getImageProps`, lazy, AVIF or WebP). Hover pushes the
   screenshot in by 1.5%.
3. The foot row: the numeral (`text-numeral`, light, muted), the caption
   (what it is, what it's built with, its links) and `ArrowLong` to the next
   plate. On phones the caption sits above the numeral and arrow.

The window is also a pointer-only link (or assistant button) to the
product; keyboard and screen-reader users get the labelled link in the
caption. Plates of CMS projects share view-transition names with their case
study (`transition`), so the title and window carry across the navigation.

- `LiveSystemPlates`: the three products on this site (`lib/systems.ts`),
  flagship first. Home page, and the work page while the CMS is empty.
- Work page: every CMS case study as a plate. `previewForProject` gives a
  case study its product's screenshot when its title or slug names one of
  the live products; otherwise `StackWindow` shows its architecture
  (`StackMap`) zoomed into a dark window.
- Case study: the same plate at the top (with `h1`), the write-up, and a
  foot link to the next case study (numeral, serif title, arrow).
- `ContactPlate`: the canvas pages' close, a statement at `text-poster` and
  two pills.

Screenshots live in `src/assets/previews/` (WebP, desktop 2560px wide,
phone 1080×1350). They are captures of the real pages with headless Chrome
at 1440×1024 (2x) and 390×844 (3x, top 4:5 kept), reduced motion on, the
site frame cropped off. Retake them when a product's first screen changes.

`StackMap`: a project's technologies on Interface → API → Data → Services,
with real marks, a plain "where it runs" line per layer in the wide flow,
and languages on their own line. A recessed well with a drafting dot grid;
flow switches from rows to columns at a 34rem content width (container
query). A `figure` whose caption reads the whole architecture to screen
readers; the drawing itself is `aria-hidden`.

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
  a wide feature tile, a step brighter with a verdigris hairline
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

- Canvas pages: centred composition, as on the board. Generous, fixed
  rhythm between parts: plate top 72–160px, title to window 36–88px,
  window to foot row 32–72px (all in `Plate.tsx`).
- `.site-frame`: the product pages sit inside a weathered frame, `--frame`
  wide, rust at the top of the screen through deep ink to patina at the
  bottom; a fixed, pointer-transparent overlay. On canvas pages `--frame`
  is 0. Anything fixed adds `var(--frame)` to its offset.
- `container-page`: max 84rem with fluid gutters (`--gutter`).
- `py-section` / `pb-section`: fluid vertical rhythm (`--section`).
- Radii follow hierarchy: windows 16–32px, pills fully round, product
  controls 2px, product panels 4–8px.

## Motion

Motion answers the reader; nothing animates on load or on scrolling into
view.

- Pills: colour step to rust and a 45° turn of the arrow on hover.
- Windows: the screenshot pushes in 1.5% on hover. The plate arrow slides
  4px.
- In-page anchors glide (`scroll-behavior: smooth`, with
  `data-scroll-behavior="smooth"` on `<html>` so route changes still jump).
- Route changes: React `<ViewTransition>`; a CMS plate's title and window
  carry into the case study.
- The assistant panel fades in when opened (`animate-fade-in`).
- Animate `transform`, `opacity` and colours only. No blur filters or
  `backdrop-filter`. Everything is disabled under
  `prefers-reduced-motion: reduce`.

## Performance rules

- Server Components by default. Client components today: `SiteNav`,
  `ChatLauncher` (panel lazy-loaded on intent), `OpenChatButton`,
  `ShopifyImage`, forms, the dashboard's page links and Log out, and its
  `ChartFrame` and `RefreshControl` (on `/saas` and the dashboard only).
- No animation, 3D or UI libraries. `lucide-react` stays inside the
  products; canvas parts use `Arrow.tsx`.
- `src/lib/config.ts` must stay dependency-free: it is imported by browser
  code.
- Images through `next/image` with real `sizes`. Plate screenshots are lazy
  (no plate is above the fold) and art-directed, so a phone downloads only
  the phone capture.
- `experimental.inlineCss` was measured and rejected on Next 16.2 (HTML grew
  from ~12 KB to ~42 KB gzipped). Re-measure before enabling it.
- Fonts: Hanken Grotesk (28 KB) preloaded everywhere; Playfair Display
  (23 KB) preloaded on canvas pages only; Geist Mono (9 KB) on first use in
  the products. Adding a family, weight or range needs a measured reason.
- Measure over HTTP/2: `next start` serves HTTP/1.1, which Lighthouse models
  with six connections per origin. Put an HTTP/2 proxy in front of
  `next start` for representative numbers.

## Case-study format

The CMS stores plain text. `src/lib/case-study.ts` renders:
one paragraph per line, `## Heading`, `### Subheading`, and `- list item`.
No HTML is interpreted.
