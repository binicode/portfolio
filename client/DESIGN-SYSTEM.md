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
- `components/work/ProjectPlate.tsx`: five structural motifs (truss bridge,
  column grid, arch, cantilever, strata). A project's plate is chosen by its
  position in the newest-first list, so it matches on the work list and its
  case study (shared view-transition name).
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

Scale (all in `@theme`): `text-display`, `text-stat` (About numerals),
`text-h1`, `text-h2`, `text-statement` (large reading text, 24px+),
`text-title` (project titles), `text-h3`, `text-lead`, then Tailwind's
`text-base` / `text-sm`. Body is 16px / 1.6. Headings use
`text-wrap: balance`.

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

## Dashboard charts (Creator Dashboard)

- Layout: a metric row of one tile per source (status badge, headline
  figure, two supporting numbers, a small chart), then the repositories
  table (8 of 12 columns at `xl`) beside the latest Hacker News mentions.
- `DashboardBody` renders all of it. The dashboard page passes live stats;
  `DashboardPreview` (on `/saas` and the locked dashboard) passes fixed
  sample data with `preview` (fewer rows, secondary panels hidden on small
  screens, no hover readouts) inside an `inert` frame. One component, so
  the preview cannot drift from the product. The home page uses `compact`
  (metric row only): the full replica there cost ~220 DOM nodes below the
  fold.
- `ColumnSpark` (bars) and `LineSpark` (line) in `components/saas/charts/`
  are server components: no chart library, no client JavaScript.
- One series per chart in the de-emphasis gray `--chart-muted` (#6f6e72,
  3.7:1 on the card), with one mark in the accent: the newest video, the
  current week, the top repository. Validated with the dataviz skill's
  script (CVD ΔE 10.3, both colours above 3:1); the gray is neutral by
  design.
- Marks: bars at most 24px wide, 4px rounded top, square baseline, air
  between them; 2px line with non-scaling stroke over a faint wash; end dot
  with a 2px surface ring. One hairline at the maximum, labelled for scale.
- Hover readouts (`.chart-tip`) put the value first, then the name. They
  enhance only: each chart's `role="img"` name lists every value.
- Status badges always pair a dot and a word with the colour (`Badge dot`).
  Repository status comes from GitHub's archived flag and last push:
  Active (30 days), Quiet (6 months), Dormant (older). Source badges: Live,
  Not connected (with a connect link), Unavailable (the provider failed).
- Phones: the table drops secondary columns and shows status and last push
  under the repository name, so nothing important sits off-screen.

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
- Route changes: React `<ViewTransition>` (`experimental.viewTransition`).
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
  and dashboard navigation.
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
