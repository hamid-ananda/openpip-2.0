# Handoff: openPIP — Modernized Web Application

## Overview
A modernization of openPIP (the Open-source Protein Interaction Platform) — a research tool for searching, visualizing, and exporting protein-protein interaction (PPI) data from the CCSB Human Interactome. This handoff covers a full set of redesigned pages: home/landing, search & network visualization, protein detail, downloads, docs/API, about/FAQ, sign in, and register.

## About the Design Files
The files in this bundle are **design references created in HTML** — interactive prototypes that demonstrate the intended visual design, layout, and behavior. They are **not production code**. The task is to **recreate these HTML designs in the target codebase's existing environment** (React, Vue, Next.js, etc.) using its established component library, design tokens, routing, and data patterns. If no environment exists yet, pick the most appropriate framework (React + Vite or Next.js are good defaults for a data-heavy science web app) and implement there.

The HTML uses inline React + Babel for prototyping only — do not copy the Babel/CDN setup into production.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, component sizes, and interactions are intended to be implemented pixel-accurately. Use the design tokens listed below verbatim. Both **light and dark themes** are specified.

## Screens / Views

### 1. Home (`HomeScreen` in `screens.jsx`)
- **Purpose:** Landing page; orient new users and route them to search, atlas, or downloads.
- **Layout:** Top nav · Hero (2-column 1.1fr/1fr at 64/80px padding) with headline, sub, primary+secondary CTAs, 3-up stats, and a card with a live network preview · "Three ways to start" 3-column action cards · News card (1.4fr) + Cite card (1fr, gradient).
- **Key copy:** Headline reads "The protein interaction graph, made queryable."; stats are 11,600 proteins / 76,563 interactions / 6 datasets.

### 2. Search & Network (`SearchScreen` in `screens.jsx`) — the primary tool
- **Purpose:** Query a gene, see its interactome subgraph, filter, and export.
- **Layout:** Nav · Two-pane body: 320px sidebar (Query input, suggestion chips, min-confidence slider, source toggles, tissue dropdown) + main area with toolbar (title + count, layout switcher, Export button), graph canvas (radial-gradient bg), floating legend top-right, zoom stack bottom-left, and a 200px-max scrollable interactions table footer.
- **Tweaks exposed:** sidebar can flip Left/Right (`layout`), node style Filled/Outlined/Minimal (`nodeStyle`), density Compact/Comfortable.

### 3. Protein Detail (`ProteinDetailScreen` in `screens-more.jsx`)
- **Purpose:** Drill into a single protein.
- **Layout:** Breadcrumb · Header row (chips, big gene symbol with UniProt id beside it, description, action buttons) · 4-cell stat strip (Interactors / Interactions / Avg. confidence / Tissues) · Tab bar (Interactions/Sequence/Expression/Domains/Literature) · Body grid 1.4fr/1fr: graph card + stack of cards (GO function, Tissue expression with horizontal bars, Cross references) · Full-width "All interactions" table with partner/score/method/dataset/view-action columns.

### 4. Downloads (`DownloadsScreen` in `screens.jsx`)
- **Purpose:** Bulk dataset access.
- **Layout:** Header section · Publication-moratorium warning card with left orange border · Dataset table: name + kind chip + note (1fr), interaction count (140px), PMID link (140px), download format chips (.tab/.sif/.csv, 220px right-aligned).

### 5. Docs / API (`DocsScreen` in `screens-more.jsx`)
- **Purpose:** API reference.
- **Layout:** Three columns 240/1fr/280: left section nav with version chip + search, main article with breadcrumb/h1/intro/endpoint card (method badge, path, query-parameter rows)/`bash` example/`json` example, right "On this page" rail + "Need a key?" callout.
- **Endpoint card:** Green `GET` pill + monospaced path; query-param rows use a 160/100/1fr grid.

### 6. About / FAQ / Contact (`AboutScreen` in `screens.jsx`)
- **Purpose:** Project info, FAQ, contact.
- **Layout:** 220px sticky contents nav + 720px article column · Hero h1 + lede · Sections · Collapsible `<details>` FAQ rows · Contact card (2-column grid: maintainer + original development).

### 7. Sign In (`LoginScreen` in `screens.jsx`)
- **Layout:** 1fr/1fr split. Left: wordmark, h1, username, password (forgot link), primary submit, OR divider, ORCID button, register link. Right: gradient panel with outlined network graph and pull-quote.

### 8. Register (`RegisterScreen` in `screens-more.jsx`)
- **Layout:** 1fr/1fr split. Left: form (first/last name, institutional email, affiliation, password with 4-segment strength meter, terms checkbox, primary submit, ORCID fallback, sign-in link). Right: benefits panel listing Bulk downloads / API access / Saved queries / Update digests with checkmark icons.

## Interactions & Behavior
- **Network graph:** Hover a node dims non-neighbors to opacity .25 and edges to opacity .08 (200ms transition). Click selects.
- **Search filters:** Sidebar controls update the rendered graph and the results table live (no submit).
- **Theme toggle:** `data-theme="dark"` on `<html>` swaps the entire token set; no per-component logic needed.
- **Tabs (Protein detail):** Active tab has primary color + 2px bottom border (overlapping container border by -1px).
- **FAQ rows:** Native `<details>`/`<summary>`.
- **Buttons:** `.op-btn` has 150ms all transition; primary variant uses solid `--primary` with white text; hover deepens to `--primary-deep`.

## State Management
Minimum per-screen state:
- Search: `query`, `filter { score, hiUnion, literature, … }`, `selectedNode`
- Detail: active tab, depth selector
- Auth: form fields, password strength
- App-level: theme (`light` | `dark`), accent color

In a real app, route state via URL params (`/search?gene=BAD&depth=1&min_score=0.4`) so prototype queries are shareable.

## Design Tokens
All tokens live in `styles.css`. Light theme on `:root`, dark theme on `[data-theme="dark"]`.

### Colors — Light
| Token | Hex |
| --- | --- |
| `--bg` | `#fafafa` |
| `--surface` | `#ffffff` |
| `--surface-2` | `#f4f6f9` |
| `--border` | `#e5e9ef` |
| `--border-strong` | `#cbd2dc` |
| `--text` | `#0b1220` |
| `--text-muted` | `#5b6473` |
| `--text-soft` | `#8a93a3` |
| `--primary` | `#2563eb` |
| `--primary-soft` | `#dbeafe` |
| `--primary-deep` | `#1e40af` |
| `--accent` | `#0ea5e9` |
| `--accent-2` | `#06b6d4` |
| `--danger` | `#e11d48` |
| `--success` | `#10b981` |
| `--warn` | `#f59e0b` |
| `--query` | `#e11d48` |
| `--interactor` | `#2563eb` |
| `--hi-union` | `#7c3aed` |
| `--literature` | `#0ea5e9` |
| `--huri-lit` | `#ec4899` |

### Colors — Dark
| Token | Hex |
| --- | --- |
| `--bg` | `#0a0e17` |
| `--surface` | `#11161f` |
| `--surface-2` | `#161c28` |
| `--border` | `#232b3a` |
| `--border-strong` | `#313b4f` |
| `--text` | `#e6e9ef` |
| `--text-muted` | `#8993a5` |
| `--text-soft` | `#5f6878` |
| `--primary` | `#5b8bff` |
| `--primary-soft` | `#1a2540` |
| `--primary-deep` | `#93b4ff` |
| `--query` | `#fb7185` |
| `--hi-union` | `#a78bfa` |
| `--literature` | `#38bdf8` |
| `--huri-lit` | `#f472b6` |

### Typography
- **Sans:** `Geist`, 300/400/500/600/700 (via Google Fonts)
- **Mono:** `Geist Mono`, 400/500 (used for gene IDs, codes, numbers — apply `font-variant-numeric: tabular-nums`)
- **Scale (px):** 11 (uppercase eyebrows + chips), 12, 13 (body small), 14 (body), 15, 16, 17 (lede), 18, 20, 28 (stat numbers), 36, 38, 42, 56 (hero h1)
- **Tracking:** Headings `letter-spacing: -.02em` to `-.03em`; eyebrow labels `.08em–.12em` uppercase

### Spacing & shape
- Page horizontal padding: 80px on full-width sections
- Card padding: 20–28px; section vertical: 32–80px
- `--radius: 10px`, `--radius-sm: 6px`, buttons 8px, chips 999px

### Shadow tokens
- `--shadow-sm: 0 1px 2px rgba(11,18,32,.04), 0 1px 1px rgba(11,18,32,.03)`
- `--shadow-md: 0 4px 12px rgba(11,18,32,.06), 0 1px 3px rgba(11,18,32,.04)`
- `--shadow-lg: 0 18px 40px rgba(11,18,32,.10), 0 4px 10px rgba(11,18,32,.05)`
(Dark theme uses deeper rgba(0,0,0,…) values — see `styles.css`.)

### Reusable utility classes (in styles.css)
- `.op-btn`, `.op-btn.primary`, `.op-btn.ghost`
- `.op-input`
- `.op-card`
- `.op-chip`, `.op-chip.primary`, `.op-chip.dot`
- `.op-num` (tabular-nums monospace)

## Assets
- **Logo:** SVG-only mark drawn in `OpLogo` (red center node + 4 blue satellites). No external image asset required.
- **Network data:** `BAD_NETWORK` constant in `components.jsx` is sample data for the prototype — wire to your API in production.
- **Icons:** Inline SVG, 1.5–2.5 stroke width, currentColor. Replace with your existing icon system (Lucide is a close match stylistically) when integrating.
- **Fonts:** Geist + Geist Mono from Google Fonts. Use whichever font-loading strategy your codebase uses (next/font, fontsource, etc.).

## Files in this bundle
- `index.html` — root app, design canvas mount, tweaks panel wiring
- `styles.css` — all design tokens + utility classes (light + dark)
- `components.jsx` — `OpLogo`, `OpWordmark`, `NetworkGraph`, `OpNav`, sample data
- `screens.jsx` — `HomeScreen`, `SearchScreen`, `DownloadsScreen`, `AboutScreen`, `LoginScreen`
- `screens-more.jsx` — `ProteinDetailScreen`, `DocsScreen`, `RegisterScreen`
- `design-canvas.jsx`, `tweaks-panel.jsx` — prototype-only framing; do not port.

## Implementation notes
- **Do port:** the tokens, the component compositions, the layout grids, the copy.
- **Do not port:** the design canvas, the tweaks panel, the inline Babel transpiler, the demo network data.
- **Routing:** treat each `*Screen` as a route. Suggested paths: `/`, `/search`, `/protein/:symbol`, `/downloads`, `/docs`, `/about`, `/login`, `/register`.
- **Accessibility:** the prototype is not audit-clean. When implementing, add proper labels, focus rings (use `--primary-soft` 3px outline like `.op-input:focus`), keyboard nav for graph nodes, and aria-live regions for query result counts.
