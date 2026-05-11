# openPIP — Complete Frontend Documentation
> Written for React + TypeScript recreation. Every page, component, data shape, and behavior documented.

---

## Table of Contents

1. [Tech Stack & Libraries](#1-tech-stack--libraries)
2. [Global Layout & Navigation](#2-global-layout--navigation)
3. [Theming & Color System](#3-theming--color-system)
4. [Pages Overview](#4-pages-overview)
5. [Page: Home](#5-page-home)
6. [Page: Search Results (Core Page)](#6-page-search-results-core-page)
   - [Data Shape from API](#61-data-shape-from-api)
   - [Network Toolbar (cy-nav)](#62-network-toolbar-cy-nav)
   - [Cytoscape Network Graph](#63-cytoscape-network-graph)
   - [Filter Panel](#64-filter-panel)
   - [Search Panel](#65-search-panel)
   - [Bottom Table Panel](#66-bottom-table-panel)
   - [Overlay / Modal System](#67-overlay--modal-system)
   - [Download System](#68-download-system)
   - [External Links](#69-external-links)
7. [Page: Download](#7-page-download)
8. [Page: About / FAQ / Contact / Documentation](#8-page-about--faq--contact--documentation)
9. [Admin Pages](#9-admin-pages)
10. [Auth Pages (Login / Register / Profile)](#10-auth-pages-login--register--profile)
11. [TypeScript Data Types](#11-typescript-data-types)
12. [API Endpoints for React Frontend](#12-api-endpoints-for-react-frontend)
13. [React Component Tree](#13-react-component-tree)
14. [State Management Design](#14-state-management-design)
15. [Recreating with React + TypeScript: Step-by-Step](#15-recreating-with-react--typescript-step-by-step)

---

## 1. Tech Stack & Libraries

### Current stack (to replace/adapt)

| Library | Version | Purpose | React Equivalent |
|---|---|---|---|
| jQuery 2.1.4 | legacy | DOM manipulation, AJAX | React state + fetch/axios |
| Bootstrap 3 | 3.x | Layout, grid, components | Tailwind CSS or Bootstrap 5 |
| Cytoscape.js | 3.x | Network graph visualization | `cytoscape` npm package (same) |
| cytoscape-cola | - | Force-directed layout plugin | `cytoscape-cola` npm package |
| cytoscape-euler | - | Euler layout plugin | `cytoscape-euler` npm |
| cytoscape-expand-collapse | - | Node collapse/expand | `cytoscape-expand-collapse` npm |
| cytoscape-panzoom | - | Pan/zoom UI widget | `cytoscape-panzoom` npm |
| cytoscape-qtip | - | Node hover tooltips | Implement as React portal |
| jquery.qtip | 2.x | General tooltips | React tooltip library |
| FooTable | 2.x | Responsive paginated tables | TanStack Table |
| particles.js | 2.0.0 | Animated particle background | `tsparticles` npm |
| Readmore.js | 2.2.0 | "Read more" text expansion | CSS + React state |
| spectrum.js | - | Color picker (admin only) | `react-color` |
| TinyMCE | - | WYSIWYG editor (admin only) | `@tinymce/tinymce-react` |
| Dropzone.js | - | File upload (admin only) | `react-dropzone` |
| jQuery UI | - | Slider, autocomplete | `rc-slider`, `@headlessui/react` combobox |
| Font Awesome | 4.x | Icons | `react-icons` or Heroicons |

---

## 2. Global Layout & Navigation

### Layout Structure
```
<html>
  <head>
    CSS: bootstrap, jquery-ui, qtip, main.css, [page].css
  </head>
  <body>
    <header>
      <nav.main_header>     ← SVG logo + site title (from admin_settings.title)
      <nav.navbar>          ← Page navigation bar (conditional on login_status)
    </header>
    <main>                  ← Page content block
    <footer>                ← HTML from admin_settings.footer (raw HTML)
    JS: jquery, jquery-ui, bootstrap, qtip, [page].js
  </body>
</html>
```

### Navigation Bar — Two States

**Logged-out nav links:**
- Home → `/`
- Search → `/search_results`
- Downloads → `/download`
- About → `/about`
- FAQ → `/faq`
- Contact → `/contact`
- Register (right) → `/register`
- Login (right) → `/login`

**Logged-in nav links (adds):**
- Profile (right) → `/profile`
- Logout (right) → `/logout`

**Admin-only extras (when `admin_status == true`):**
- Announcements → `/admin/announcement/`
- Data → `/admin/data/`
- Files → `/admin/file_manager/FASTA`
- Settings → `/admin/settings`

### SVG Logo
Inline SVG in `base.html.twig`. It's a protein interaction network diagram (5 nodes + 3 edges). The node fill and edge stroke colors come from `logo_color_scheme` (a CSS color string from `admin_settings`).

### React Navigation Component
```tsx
// Props needed:
interface NavProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  shortTitle: string;
  mainColorScheme: string;  // e.g. "#a51c30"
  logoColorScheme: string;
  headerColorScheme: string;
}
```

---

## 3. Theming & Color System

All colors come from the `admin_settings` database row (id=1). They are injected into every page as Twig variables.

| Variable | Usage | Example value |
|---|---|---|
| `main_color_scheme` | Navbar bg, headings, borders | `#a51c30` (Harvard red) |
| `header_color_scheme` | Text on colored navbar bg | `#ffffff` |
| `logo_color_scheme` | SVG logo node/edge color | `#ffffff` |
| `button_color_scheme` | Button variants | `#a51c30` |
| `query_node_color` | Cytoscape query protein node | `#cc0000` |
| `interactor_node_color` | Cytoscape interactor node | `#3c78d8` |
| `published_edge_color` | Cytoscape edge - Published | `#38761d` |
| `validated_edge_color` | Cytoscape edge - Validated | `#1155cc` |
| `verified_edge_color` | Cytoscape edge - Verified | `#cc0000` |
| `literature_edge_color` | Cytoscape edge - Literature | `#ff9900` |

**Special edge color rule:** If an interaction has BOTH experimental and Literature categories, the edge color is `#ff55dd` (pink). This overrides category colors.

### React Theme Context
```tsx
interface ThemeConfig {
  mainColor: string;
  headerColor: string;
  logoColor: string;
  buttonColor: string;
  queryNodeColor: string;
  interactorNodeColor: string;
  edgeColors: {
    Published: string;
    Validated: string;
    Verified: string;
    Literature: string;
    mixed: string; // "#ff55dd"
  };
}
```

---

## 4. Pages Overview

| Route | Page | Template | JS File |
|---|---|---|---|
| `/` or `/home` | Home | `home2.html.twig` | `home.js` |
| `/search/{term}` | Search Results | `search_result.html.twig` | `search_results.js` + `main.js` |
| `/download` | Download | `download.html.twig` | `download.js` |
| `/about` | About | `about.html.twig` | `about.js` |
| `/faq` | FAQ | `faq.html.twig` | `faq.js` |
| `/contact` | Contact | `contact.html.twig` | `contact.js` |
| `/documentation` | Documentation | `documentation.html.twig` | none |
| `/login` | Login | FOSUser override | none |
| `/register` | Register | FOSUser override | none |
| `/profile/...` | Profile | FOSUser override | `profile.js` |
| `/admin/settings` | Admin Settings | `admin_settings.html.twig` | `admin_settings.js` |
| `/admin/announcement/...` | Announcements | `announcement_manager.html.twig` | `announcement_manager.js` |
| `/admin/data/...` | Data Manager | `data_manager.html.twig` | `data_manager.js` |
| `/admin/file_manager/...` | File Manager | `file_manager.html.twig` | `file_manager.js` |

---

## 5. Page: Home

**Route:** `/`  
**Template:** `home2.html.twig`  
**JS:** `home.js`

### Sections (top to bottom)

#### Section 1: Hero / Stats Banner
- Full-width, positioned with particle.js animated background (two overlapping canvas layers: `particles-js1` + `particles-js2`)
- Centered white card (max-width 500px, red border `#a51c30`, absolute centered)
- Large site title (`short_title`) in `main_color_scheme` color, font-size 100px
- Two stat counters side by side:
  - **Proteins**: `protein_count` (integer from DB)
  - **Interactions**: `interaction_count` (integer, only `removed=0`)

#### Section 2: Mission + Mini Network (Two Columns)
- **Left column (col-sm-6):** Mission text
  - `<h4>` with `mission_title` (raw HTML)
  - `<p>` with `mission_text` (raw HTML, font-size 18px, Gotham HTF font)
  - Three icon links: Search (glyphicon-search), About (info-sign), Download (save)
- **Right column (col-sm-6):** Mini Cytoscape network (`#cy`, `#cy_div`)
  - Random protein network rendered using Cytoscape.js + cola layout
  - Refresh button (`#refresh_cy`) — re-randomizes and re-renders the network
  - Network loaded via AJAX to `/download` endpoint on page load

#### Section 3: Announcements + Image Carousel (Two Columns)
- Particle.js background layer (`particles-js3` + `particles-js4`)
- **Left column:** Announcements panel
  - Header bar with `main_color_scheme` background
  - Scrollable list (max-height 300px, overflow-y scroll)
  - Each announcement shows: `title` (h4), `date` (Y-m-d format), `text` (raw HTML)
- **Right column:** Bootstrap 3 image carousel (3 slides)
  - Images: `img_1.jpg`, `img_2.jpg`, `img_3.jpg` from `{url}/assets/images/`
  - Has prev/next controls

#### Section 4: Methods Section
- Particle.js footer band (`particles-js5` + `particles-js6`)
- `method_title` (raw HTML, h4)
- `method_text` (raw HTML, p, font-size 18px)

#### Footer
- Raw HTML from `admin_settings.footer`

### JS Variables Injected (home page)
```javascript
var Url = "{{ url }}";           // base URL e.g. "https://openpip.usask.ca/"
var rand_protein = "{{ rand_protein }}"; // semicolon-separated gene names for typeahead
```

### `rand_protein` — Typeahead Source
Up to 100 protein gene names from DB, joined with `;`. Used for the search autocomplete on the home page typeahead input.

### React Component Breakdown for Home
```
<HomePage>
  <HeroSection proteins={count} interactions={count} title={shortTitle} />
  <MissionSection title={missionTitle} text={missionText} />
  <MiniNetworkGraph randomProteins={randProtein.split(';')} />
  <AnnouncementsSection announcements={announcements[]} />
  <ImageCarousel images={['img_1.jpg','img_2.jpg','img_3.jpg']} />
  <MethodsSection title={methodTitle} text={methodText} />
  <Footer html={footerHtml} />
```

---

## 6. Page: Search Results (Core Page)

**Route:** `/search/{comma-separated-gene-names}`  
**Template:** `search_result.html.twig`  
**JS:** `search_results.js` + `main.js`

This is the most complex page. It has three stacked zones:
1. **Overlay layer** — modals for download, login prompts, loading states
2. **Network zone** — toolbar (cy-nav) + Cytoscape canvas (760px tall)
3. **Table zone** — tabbed data tables below the network

### 6.1 Data Shape from API

The PHP controller serializes all data to JSON and embeds it in the page as:

```javascript
var SearchResultsJSON = JSON.parse({{ json|json_encode|raw }});
```

#### `SearchResultsJSON` shape:
```typescript
interface SearchResultsJSON {
  all_proteins: Protein[];
  all_interactions: Interaction[];
  domains: string;              // "" (not used currently)
  complexes: string;            // "" (not used currently)
  query_protein_id_array: number[];
  search_term: string;          // "BAD,BCL2L1" or "no_search"
  found_protein_summary: string;    // "<br>"-joined found gene names
  unfound_protein_summary: string;  // "<br>"-joined not-found gene names
}
```

#### `Protein` shape:
```typescript
interface Protein {
  protein_id: number;
  protein_uniprot_id: string;
  protein_ensembl_id: string;
  protein_entrez_id: string;
  protein_gene_name: string;
  protein_protein_name: string;
  protein_description: string;
  protein_sequence: string;
  number_of_interactions_in_database: number;
  annotation_array: {
    [type_name: string]: string;  // JSON string of annotation data
  };
}
```

#### `Interaction` shape:
```typescript
interface Interaction {
  interaction_id: number;
  interactor_A: {
    protein_id: number;
    protein_uniprot_id: string;
    protein_gene_name: string;
    protein_ensembl_id: string;
  };
  interactor_B: {
    protein_id: number;
    protein_uniprot_id: string;
    protein_gene_name: string;
    protein_ensembl_id: string;
  };
  score: number | null;
  annotation_array: {
    [type_name: string]: string[];  // e.g. { "litbm_interaction": [...] }
  };
  experiment_array: any[];
  dataset_array: Dataset[];
  interaction_category_array: {
    highest_category_status: string;   // e.g. "Published"
    highest_order: number;
    interaction_category_array: CategoryEntry[];
  };
}

interface Dataset {
  dataset_reference: string;    // PubMed ID
  dataset_author: string;       // e.g. "Rolland et al.(2014)"
  year: string;
  description: string;
  interaction_status: string;
  name: string;
}

interface CategoryEntry {
  category_name: string;  // "Published" | "Validated" | "Verified" | "Literature"
  order: number;
}
```

#### Other injected JS variables on search result page:
```javascript
var CategoryArray = { /* category_name → {category_name, order, color_scheme, selected_by_default} */ };
var queryParameters = {
  CategoryParameterArray: { [name]: [bool] },
  TissueExpressionParameterArray: {},
  SubcellularLocationExpressionArray: {},
  ScoreParameter: 0,
  SearchTerm: "BAD,BCL2L1",
  TextOutput: null,
  AnnotationParameterArray: { [field]: bool },
  FilterParameter: "None" | "query_query" | "query_interactor",
  SearchTermArray: ["BAD", "BCL2L1"],
};
var QueryNodeColor = "#cc0000";
var InteractorNodeColor = "#3c78d8";
var MainColorScheme = "#a51c30";
var loggedIn = "1" | "";
var Url = "https://openpip.usask.ca/";
var Version = "1.0";
var AnnotationTypes = [...];
var AnnotationTypesArray = { [type]: { label, show_in_filter, show_in_table, fields, type } };
```

### 6.2 Network Toolbar (cy-nav)

A horizontal navbar above the Cytoscape canvas. Contains dropdown menus:

#### Left-side dropdowns:
1. **Search** — opens a tabbed dropdown with two tabs:
   - **Query tab**: `<textarea id="search_identifier">` — enter comma/newline-separated gene names
     - "Random", "Example 1", "Example 2", "Example 3" links
     - Validation feedback: count of found/not-found terms
     - "Remove Terms" button — strips invalid terms from textarea
     - Checkboxes: "Query-Query" / "Query-Interactor" filter mode
     - "Return Data File" checkbox — skip display, go straight to download
     - "Update" button → triggers new search
   - **Interactors tab**: `<textarea id="interactor_list">` — filter by specific interactors
     - Same validation pattern
     - "Update" button → AJAX call to `/search_results_interactions`

2. **Filter** — two-column dropdown:
   - **Left column:**
     - **Minimum Score slider** (jQuery UI slider, range 0–1)
     - **Interaction Status checkboxes** — one per `interaction_category` from DB (e.g. Published, Validated, Verified, Literature)
     - **Show tissue expression** checkbox — resizes nodes proportional to tissue expression values
     - **Reflect tissue specificity** checkbox — recolors nodes by tissue specificity
   - **Right column:**
     - Annotation type filter checkboxes (from `annotation_type` table where `show_in_filter=1`)
     - Each group is in a scrollable box (height 300px)
   - "Update" button → re-renders network with new filters

3. **Layout** — dropdown with 5 layout options:
   - Cola (force-directed, default)
   - Cose (compound spring embedder)
   - Concentric (rings)
   - Circle
   - Grid
   - Each has a thumbnail image from `/assets/images/{name}_layout.png`

4. **Downloads** — dropdown:
   - **Image:** PNG download of current network canvas
   - **Network Data (5 formats):**
     - Interactions (PSI-MI Tab 2.7) → `.tab`
     - Interactions (SIF) → `.sif`
     - Interactions (CSV) → `.csv`
     - Interactors (CSV) → `.csv`
     - Protein Sequences (FASTA) → `.fasta`

5. **External Links** — dropdown with dynamic links populated by JS:
   - g:Profiler, Reactome, GeneMANIA, PathwayCommons, DAVID, STRING, cBioPortal, Complex Portal, IntAct
   - Links are built from selected gene names in the current network

#### Right-side dropdowns:
6. **Summary** — dropdown showing:
   - Proteins Found (scrollable, 80px)
   - Proteins Not Found (scrollable, 80px)
   - Proteins Filtered Out (scrollable, 80px)
   - Statistics: number of proteins, number of interactions, average node degree

7. **Legend** — shows color key:
   - Query node: red circle
   - Interactor node: blue circle
   - One row per interaction category with colored line (60px wide)
   - "HuRI and Literature" combined: pink (#ff55dd) line

### 6.3 Cytoscape Network Graph

**Container:** `<div id="cy">` — height 760px, width 100%, white background.

#### Node styles
```javascript
{
  selector: '.nodes',
  css: {
    content: 'data(gene_name)',       // label = gene name
    'text-valign': 'center',
    color: 'white',
    'text-outline-width': 1.4,
    'font-weight': 'bold',
    'padding-top': '10px',
    'padding-left': '10px',
    'padding-bottom': '10px',
    'padding-right': '10px',
    'background-color': InteractorNodeColor  // default = "#3c78d8" (blue)
  }
}
```

**Query nodes** get their color overridden to `QueryNodeColor` (`#cc0000` red) by:
```javascript
function setQueryNodeColor(cy) {
  // sets background-color of nodes whose protein_id is in queryProteinIdArray
}
```

#### Edge styles
Each edge color is determined by:
1. Get `highest_category_status` from `interaction_category_array`
2. If multiple categories AND one is "Literature" → `#ff55dd` (pink)
3. Otherwise → `CategoryArray[highestCategoryStatus].color_scheme`
4. Default (no category) → `#ccc` (gray)

Edge width scales with confidence score (`getEdgeWidth(score)`).

#### Node data stored in Cytoscape:
```javascript
{
  id: protein_id,
  name: gene_name,
  uniprot_id,
  ensembl_id,
  entrez_id,
  protein_name,
  gene_name,
  description,
  external_links,
  annotation_array: '',
  tissue_expression_array: {},
  subcellular_location_expression_array: {},
  query: 'non-query'   // overridden to 'query' for query nodes
}
```

#### Node hover tooltip (qtip)
When hovering a node, a popup appears with:
- Gene name (bold, colored)
- UniProt ID (link to UniProt)
- Ensembl ID (link to Ensembl)
- Protein description (with "read more" expansion)
- "Remove from network" link
- External database links

#### Edge hover tooltip (qtip)
When hovering an edge:
- "Gene A — Gene B" header
- Confidence score
- Datasets (author, year, PubMed link)
- Interaction categories

#### Layouts
Default layout is `cola` (force-directed). Options:
```javascript
cy.layout({
  name: 'cola',       // or 'cose', 'concentric', 'circle', 'grid'
  avoidOverlap: true,
  equidistant: true,
  minNodeSpacing: 50,
  randomize: true,
  fit: true,
  nodeRepulsion: 10000,
  nodeOverlap: 100,
})
```

#### Expand/Collapse
Uses `cytoscape-expand-collapse` plugin:
- `api.collapseAll()` called on init
- Collapsed nodes get purple border (`#A041F2`)
- Click collapsed node → expand to show children

#### Pan/Zoom
`cytoscape-panzoom` plugin adds zoom buttons (non-mobile only).

#### Export to Cytoscape (desktop app)
Button appears (non-mobile) that tries `cyREST` API on `localhost:1234`. If cyREST not running, shows modal message.

### 6.4 Filter Panel

Filters run entirely client-side. On "Update" click:
1. Rebuild `currentProteinArray` and `currentInteractionArray` by filtering `allProteinArray` / `allInteractionArray`
2. Filters:
   - **Score**: only keep interactions where `score >= ScoreParameter`
   - **Categories**: only keep interactions matching any checked category
   - **Annotations**: filter proteins to those having checked annotation types
3. Re-render Cytoscape with `updateCytoscapeNetwork()`

**Filter mode (from Search panel):**
- `None` — default: show query proteins + all their interactors, then interactions among those
- `query_interactor` — only show interactions between query and interactors (not interactor–interactor)
- `query_query` — only show interactions between query proteins themselves (triggered by "Query-Query" checkbox)

### 6.5 Search Panel

**Query tab behavior:**
1. User types gene names (comma/newline separated) into `<textarea id="search_identifier">`
2. Autocomplete endpoint called for suggestions
3. Validation: each term checked against `queryParameters.SearchTermArray` — shows found/not-found counts
4. "Remove Terms" removes invalid terms from textarea
5. On "Update": navigates to `/search/{terms}?filter=...&score=...&{categories}&{annotations}`

**Interactors tab behavior:**
1. User types interactor gene names into `<textarea id="interactor_list">`
2. On "Update": AJAX POST to `/search_results_interactions` with:
   ```javascript
   {
     query_interactor: 'interactor',
     search_term_parameter: currentSearchTerm,
     filter_parameter: 'query_query',
     search_term_array: interactorArray,
     query_id_array: queryProteinIdArray
   }
   ```
3. Response: new JSON with filtered proteins/interactions
4. Re-renders Cytoscape with new data

**Example queries:**
- Example 1: "BAD,BCL2L1,BCL2L2,BAK1,BMF,MCL1"
- Example 2: "BAD,BCL2L1,BCL2L2,BAK1,BMF,MCL1,BCL2L11,BCL2A1,BIK,REL"
- Example 3: "COA7"
- Random: picks N random proteins from `rand_protein` variable

### 6.6 Bottom Table Panel

Below the Cytoscape canvas. Collapsible (hamburger toggle). Has tab navigation:

#### Tabs (left to right):
1. **Interactions** (default active)
2. **Interactors**
3. **GO Enrichment**
4. **Pathway Enrichment**
5. **Complex Enrichment**
6. Dynamic tabs from `annotation_types` where `show_in_table=1`

#### Interactions Table (`#search_result_table`)
FooTable (responsive paginated table). Columns:
| Column | Data |
|---|---|
| Interactor A | Gene name (clickable → focus node in network) |
| Interactor B | Gene name (clickable → focus node in network) |
| Score | Confidence score |
| Dataset | Author, PubMed link, interaction category |

- Page size selector: 10, 50, 100, All
- Search/filter input (`#filter`)
- Clicking a row highlights the edge in Cytoscape and scrolls to it

#### Interactors Table (`#search_result_table_interactor`)
Columns:
| Column | Data |
|---|---|
| Gene Name | Clickable → highlight node |
| Interactions in Network | Count of edges for this node in current view |
| Interactions in Database | `number_of_interactions_in_database` from protein |
| Ratio Network/Database | interactions_in_network / interactions_in_database |

#### GO Enrichment (`#go_enrichment`)
Three sub-tabs: Biological Process, Molecular Function, Cellular Component.
Each has a FooTable with columns: GO Term Code, GO Term, p-value.
Data loaded via AJAX from g:Profiler API (or similar enrichment service).

#### Pathway Enrichment (`#pathways`)
FooTable: Reactome ID, Pathway name, p-value.
Data from Reactome API.

#### Complex Enrichment (`#complexes`)
FooTable: CORUM ID, Complex name, p-value.

#### Dynamic Annotation Tabs
Generated from `annotation_types` where `show_in_table=1`. Each has a FooTable with the annotation-specific `filter_name` column.

### 6.7 Overlay / Modal System

All overlays are absolutely positioned inside `#overlay_container` and default to `display:none`. They use `fadeIn/fadeOut` or visibility toggling.

| Element ID | Trigger | Content |
|---|---|---|
| `#overlay_network_no_ie` | IE browser detected | "Internet Explorer not supported" message |
| `#overlay_network_data_request_logged_out` | Download clicked, not logged in | Register/Login buttons |
| `#overlay_network_data_request_logged_in` | Download clicked, logged in | "Receive Updates" checkbox + Download button |
| `#overlay_network_cy_rest` | Export to Cytoscape clicked, cyREST inactive | Instructions to install cyREST |
| `#overlay_network_loader_image` | While network loading | "Loading Network Data" spinner |
| `#direct_download_message` | Too many interactions OR return_data_file=true | Format selector + Download/Close buttons |

**Backdrop:** All overlays have `background: rgba(255,255,255,0.80)` (semi-transparent white). Body gets `.noscroll` class to prevent scrolling.

### 6.8 Download System

All downloads are **client-side** — the JS formats the current `currentInteractionArray` data into a file and triggers a browser download via:
```javascript
function downloadFile(filename, text) {
  let a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
  a.download = filename;
  a.click();
}
```

#### Download formats:

**PSI-MI Tab 2.7** (`.tab`): TSV with 42 columns per the MITAB standard. Only fills UniProt IDs, gene names, and score. All other fields are `-`.

**SIF** (`.sif`): Tab-separated: `InteractorA\tpp\tInteractorB\n`

**Interactions CSV** (`.csv`):
```
UniProt A, UniProt B, Gene A, Gene B, Ensembl A, Ensembl B, Score, Category, Dataset
```

**Interactors CSV** (`.csv`):
```
Gene Name, UniProt ID, Ensembl ID, Entrez ID, Number of Interactions
```

**FASTA** (`.fasta`):
```
>GeneName|UniProtID
SEQUENCE...
```

**File name format:** `HuRI_download_{format}_{month}_{day}_{year}_{time}.{ext}`

**Download footer** appended to all files (comments):
```
##
## Date Downloaded: May 10 2026
## Database Version: 1.0
## Query Parameters
## Score Filter: 0.5
## Interaction Categories Included: Published, Validated
## Tissue Filter: None
```

**Save Interaction Network (POST):** When "Receive Updates" checkbox is checked before downloading, the current interaction array is POSTed to `/save_interaction_network` (requires login).

### 6.9 External Links

External links in the toolbar are auto-generated from the currently visible gene names. Built dynamically by JS using the selected node gene names:

| Service | URL pattern |
|---|---|
| g:Profiler | `https://biit.cs.ut.ee/gprofiler/gost?query={genes}` |
| Reactome | `https://reactome.org/PathwayBrowser/#DTAB=AN&ANALYSIS={...}` |
| GeneMANIA | `https://genemania.org/search/homo-sapiens/{gene}/` |
| PathwayCommons | `https://apps.pathwaycommons.org/search?q={genes}` |
| DAVID | `https://david.ncifcrf.gov/list.jsp?...` |
| STRING | `https://string-db.org/network/{taxon}/{genes}` |
| cBioPortal | `https://cbioportal.org/results?...gene_list={genes}` |
| Complex Portal | `https://www.ebi.ac.uk/complexportal/complex/search?query={gene}` |
| IntAct | `https://www.ebi.ac.uk/intact/search?query={gene}` |

---

## 7. Page: Download

**Route:** `/download`  
**Template:** `download.html.twig`  
**JS:** `download.js`

Static page with links to download full database dump files. Content is managed via the `admin_settings` or static HTML. Typical content:
- Links to pre-generated data files (CSV, FASTA, PSI-MI Tab) for the full dataset
- Description of each file format
- Citation information

---

## 8. Page: About / FAQ / Contact / Documentation

All static content pages. Content is typically stored as HTML in the database (via admin_settings fields or separate tables), rendered as raw HTML in Twig.

**Contact page** has a contact form that submits to `ContactController`. It sends an email via Swiftmailer.

---

## 9. Admin Pages

All require `IS_AUTHENTICATED_REMEMBERED` and `ROLE_ADMIN`.

### Admin Settings (`/admin/settings`)
- JS: `admin_settings.js`
- Form with TinyMCE editors for: `home_page`, `mission_title`, `mission_text`, `method_title`, `method_text`, `footer`
- Text inputs for: `title`, `short_title`, `url`, `version`
- Color pickers (spectrum.js) for all color scheme fields
- Standard form submit → PHP controller updates `admin_settings` row

### Data Manager (`/admin/data/`)
- JS: `data_manager.js`
- CRUD tables for: Proteins, Interactions, Datasets, Organisms, Domains, Annotation Types, Interaction Categories
- Search filter input per table
- Inline forms for create/edit/delete

### File Manager (`/admin/file_manager/{type}`)
- JS: `file_manager.js`
- Directory browser for `web/uploads/{type}/`
- Dropzone.js upload area (drag-and-drop or click to upload)
- File listing with delete buttons
- Folder creation form

### Announcement Manager (`/admin/announcement/`)
- JS: `announcement_manager.js`
- List of announcements with edit/delete
- "New Announcement" button → shows inline form with TinyMCE
- Form fields: `title`, `text` (TinyMCE), `date`, `show_on_home_page` (checkbox)

---

## 10. Auth Pages (Login / Register / Profile)

These use FOSUserBundle templates, overridden in `app/Resources/FOSUserBundle/views/`.

### Login (`/login`)
```html
<form action="/login_check" method="POST">
  <input id="username" name="_username" type="text">
  <input id="password" name="_password" type="password">
  <input type="hidden" name="_csrf_token" value="...">
  <button id="_submit" type="submit">Login</button>
</form>
```
After login, redirects to `/admin/home/`.

### Register (`/register`)
Standard FOSUser registration form. Fields: username, email, password, confirm password.

### Profile (`/profile/`)
Override in `UserBundle/Controller/ProfileController.php`.
Shows and edits user info. May show saved interaction networks.

### Password Reset (`/resetting/request`)
Email-based reset flow via Swiftmailer.

---

## 11. TypeScript Data Types

Complete type definitions for recreating in TypeScript:

```typescript
// ─── Theme ───────────────────────────────────────────────────────────────────
interface AdminSettings {
  title: string;
  shortTitle: string;
  footer: string;            // raw HTML
  homePage: string;          // raw HTML
  missionTitle: string;
  missionText: string;       // raw HTML
  methodTitle: string;
  methodText: string;        // raw HTML
  mainColorScheme: string;
  headerColorScheme: string;
  logoColorScheme: string;
  buttonColorScheme: string;
  queryNodeColor: string;
  interactorNodeColor: string;
  publishedEdgeColor: string;
  validatedEdgeColor: string;
  verifiedEdgeColor: string;
  literatureEdgeColor: string;
  url: string;
  version: string;
}

// ─── DB Entities ─────────────────────────────────────────────────────────────
interface Protein {
  id: number;
  uniprotId: string | null;
  proteinName: string | null;
  ensemblId: string | null;
  entrezId: string | null;
  geneName: string | null;
  sequence: string | null;
  description: string | null;
  numberOfInteractionsInDatabase: number;
}

interface Interaction {
  id: number;
  interactorA: number;   // protein.id
  interactorB: number;   // protein.id
  score: number | null;
  removed: 0 | 1;
}

interface InteractionCategory {
  id: number;
  categoryName: string;
  order: number;
  colorScheme: string;
  selectedByDefault: boolean;
}

interface Dataset {
  id: number;
  name: string;
  pubmedId: string;
  author: string;
  year: string;
  description: string;
  interactionStatus: string;
}

interface AnnotationType {
  id: number;
  type: string;
  label: string;
  description: string;
  fields: string;       // JSON array string
  showInFilter: boolean;
  showInTable: boolean;
}

interface Announcement {
  id: number;
  title: string;
  text: string;         // raw HTML
  date: string | null;  // ISO date
  showOnHomePage: boolean;
}

// ─── Frontend / Search ───────────────────────────────────────────────────────
interface ProteinNode {
  protein_id: number;
  protein_uniprot_id: string;
  protein_ensembl_id: string;
  protein_entrez_id: string;
  protein_gene_name: string;
  protein_protein_name: string;
  protein_description: string;
  protein_sequence: string;
  number_of_interactions_in_database: number;
  annotation_array: Record<string, string>;
  tissue_expression_array: Record<string, unknown>;
  subcellular_location_expression_array: Record<string, unknown>;
}

interface InteractionEdge {
  interaction_id: number;
  interactor_A: {
    protein_id: number;
    protein_uniprot_id: string;
    protein_gene_name: string;
    protein_ensembl_id: string;
  };
  interactor_B: {
    protein_id: number;
    protein_uniprot_id: string;
    protein_gene_name: string;
    protein_ensembl_id: string;
  };
  score: number | null;
  annotation_array: Record<string, string[]>;
  experiment_array: unknown[];
  dataset_array: DatasetRef[];
  interaction_category_array: {
    highest_category_status: string;
    highest_order: number;
    interaction_category_array: { category_name: string; order: number }[];
  };
}

interface DatasetRef {
  dataset_reference: string;
  dataset_author: string;
  year: string;
  description: string;
  interaction_status: string;
  name: string;
}

interface SearchResult {
  all_proteins: ProteinNode[];
  all_interactions: InteractionEdge[];
  domains: string;
  complexes: string;
  query_protein_id_array: number[];
  search_term: string;
  found_protein_summary: string;
  unfound_protein_summary: string;
}

interface QueryParameters {
  searchTerm: string;
  searchTermArray: string[];
  filterParameter: 'None' | 'query_query' | 'query_interactor';
  scoreParameter: number;
  categoryArray: Record<string, [boolean]>;
  annotationArray: Record<string, boolean>;
  textOutput: string | null;
}
```

---

## 12. API Endpoints for React Frontend

These are the PHP endpoints your React app will call:

### Public endpoints

| Method | URL | Params | Response |
|---|---|---|---|
| `GET` | `/search/{term}` | term = comma-separated gene names; query: `filter`, `score`, category names, annotation field names | Full page (SSR) → in React, call the JSON-returning variant |
| `POST` | `/search_results_interactions` | `query_interactor`, `search_term_parameter`, `filter_parameter`, `search_term_array[]`, `query_id_array[]` | `JSON` (same shape as `SearchResult`) |
| `GET` | `/autocomplete` | `q` = partial gene name | Array of matching gene names |
| `GET` | `/download` | — | Data file or page |

### Authenticated endpoints

| Method | URL | Params | Response |
|---|---|---|---|
| `POST` | `/save_interaction_network` | `json_data` = JSON string of `InteractionEdge[]` | `200 OK` |
| `POST` | `/login_check` | `_username`, `_password`, `_csrf_token` | Redirect |

### Recommended React API layer

For a React SPA, you should build a REST API alongside (or replace the Symfony controllers) to return JSON:

```typescript
// GET /api/search?q=BAD,BCL2L1&filter=None&score=0
// Returns: SearchResult

// POST /api/search/interactors
// Body: { searchTerm, filterParameter, searchTermArray, queryIdArray }
// Returns: SearchResult

// GET /api/proteins/autocomplete?q=BAD
// Returns: string[]

// GET /api/settings
// Returns: AdminSettings

// GET /api/announcements
// Returns: Announcement[]

// GET /api/counts
// Returns: { proteins: number, interactions: number, organisms: number, domains: number }
```

---

## 13. React Component Tree

```
<App>
  <ThemeProvider settings={AdminSettings}>
    <Router>
      <Layout>
        <TopBar />           ← SVG logo + title + main color
        <Navbar />           ← Nav links, auth-conditional
        <Routes>
          /                  → <HomePage />
          /search/:term      → <SearchResultsPage />
          /download          → <DownloadPage />
          /about             → <AboutPage />
          /faq               → <FAQPage />
          /contact           → <ContactPage />
          /documentation     → <DocumentationPage />
          /login             → <LoginPage />
          /register          → <RegisterPage />
          /profile           → <ProfilePage />
          /admin/settings    → <AdminSettingsPage />
          /admin/data        → <DataManagerPage />
          /admin/files       → <FileManagerPage />
          /admin/announcement→ <AnnouncementManagerPage />
        </Routes>
        <Footer html={footerHtml} />
      </Layout>
    </Router>
  </ThemeProvider>
</App>

<HomePage>
  <HeroSection />
  <ParticleBackground config={particleConfig} />
  <StatsCounter proteins={n} interactions={n} />
  <MissionSection />
  <MiniNetworkGraph proteins={randomProteins} />
  <AnnouncementsList announcements={[]} />
  <ImageCarousel images={[...]} />
  <MethodSection />

<SearchResultsPage>
  <OverlaySystem>
    <DownloadAuthModal />
    <DownloadModal />
    <CyRestModal />
    <LoadingOverlay />
    <DirectDownloadModal />
  </OverlaySystem>
  <NetworkToolbar>
    <SearchDropdown>
      <QueryTab />
      <InteractorsTab />
    </SearchDropdown>
    <FilterDropdown>
      <ScoreSlider />
      <CategoryCheckboxes />
      <TissueExpressionToggle />
      <AnnotationFilters />
    </FilterDropdown>
    <LayoutDropdown />
    <DownloadDropdown />
    <ExternalLinksDropdown />
    <SummaryDropdown />
    <LegendDropdown />
  </NetworkToolbar>
  <CytoscapeNetwork
    proteins={currentProteins}
    interactions={currentInteractions}
    queryIds={queryProteinIdArray}
    layout={selectedLayout}
    theme={theme}
    onNodeClick={handleNodeClick}
    onEdgeClick={handleEdgeClick}
  />
  <ResultTablePanel>
    <TabNav tabs={['Interactions','Interactors','GO','Pathways','Complexes',...]} />
    <InteractionsTable rows={currentInteractions} />
    <InteractorsTable rows={currentProteins} />
    <GOEnrichmentTable data={goData} />
    <PathwayEnrichmentTable data={reactomeData} />
    <ComplexEnrichmentTable data={corumData} />
  </ResultTablePanel>
```

---

## 14. State Management Design

The search results page has complex interdependent state. Recommended structure:

```typescript
// Global app state (React Context or Zustand)
interface AppState {
  settings: AdminSettings;
  user: { isLoggedIn: boolean; isAdmin: boolean } | null;
}

// Search results page state
interface SearchState {
  // Raw data from API
  allProteins: ProteinNode[];
  allInteractions: InteractionEdge[];
  queryProteinIds: number[];
  searchTerm: string;
  foundSummary: string;
  unfoundSummary: string;

  // Filter state
  scoreFilter: number;                              // 0–1
  categoryFilter: Record<string, boolean>;          // { Published: true, ... }
  annotationFilter: Record<string, boolean>;        // { brain: true, ... }
  filterMode: 'None' | 'query_query' | 'query_interactor';
  tissueExpressionActive: boolean;
  tissueSpecificityActive: boolean;

  // Derived (computed from filters)
  currentProteins: ProteinNode[];
  currentInteractions: InteractionEdge[];

  // UI state
  selectedLayout: 'cola' | 'cose' | 'concentric' | 'circle' | 'grid';
  activeModal: null | 'download' | 'downloadAuth' | 'cyRest' | 'loading';
  activeTableTab: string;
  activeSearchTab: 'query' | 'interactors';

  // Enrichment results (fetched on demand)
  goEnrichment: GOResult | null;
  pathwayEnrichment: ReactomeResult | null;
  complexEnrichment: CorumResult | null;
}
```

**Key derived computation (runs whenever filters change):**
```typescript
function filterProteinsAndInteractions(
  allProteins: ProteinNode[],
  allInteractions: InteractionEdge[],
  filters: FilterState
): { proteins: ProteinNode[]; interactions: InteractionEdge[] } {
  // 1. Filter interactions by score + categories
  let filteredInteractions = allInteractions
    .filter(i => filters.scoreFilter === 0 || (i.score ?? 0) >= filters.scoreFilter)
    .filter(i => {
      const cat = i.interaction_category_array?.highest_category_status;
      return !cat || filters.categoryFilter[cat] !== false;
    });

  // 2. Get protein IDs present in filtered interactions
  const proteinIds = new Set(filteredInteractions.flatMap(i => [
    i.interactor_A.protein_id,
    i.interactor_B.protein_id
  ]));

  // 3. Filter proteins
  const filteredProteins = allProteins.filter(p => proteinIds.has(p.protein_id));

  return { proteins: filteredProteins, interactions: filteredInteractions };
}
```

---

## 15. Recreating with React + TypeScript: Step-by-Step

### Recommended stack
```
React 18 + TypeScript
Vite (build tool)
React Router v6
TanStack Query (data fetching)
Zustand (state management for search page)
Tailwind CSS (replaces Bootstrap 3)
cytoscape + cytoscape-cola + cytoscape-panzoom (same libs, just npm)
@tanstack/react-table (replaces FooTable)
rc-slider (replaces jQuery UI slider)
tsparticles / react-tsparticles (replaces particles.js)
react-tooltip (replaces qtip)
axios (HTTP client)
```

### Step 1 — Scaffold
```bash
npm create vite@latest openpip-frontend -- --template react-ts
cd openpip-frontend
npm install react-router-dom @tanstack/react-query zustand
npm install cytoscape cytoscape-cola cytoscape-panzoom cytoscape-qtip
npm install @types/cytoscape
npm install rc-slider @tanstack/react-table
npm install tsparticles react-tsparticles
npm install axios
```

### Step 2 — Build the API layer
Create `src/api/` with typed fetch functions that call the Symfony backend (or your new REST API). Start with:
- `fetchSettings()` — GET /api/settings
- `searchProteins(term, params)` — GET /api/search?q=...
- `searchInteractors(body)` — POST /api/search/interactors

### Step 3 — Build ThemeProvider
Fetch settings on app load, store in React context. All color values flow from here.

### Step 4 — Build Navigation + Layout
Simple `<header>` + `<nav>` + `<main>` + `<footer>` layout. Nav conditionally renders admin links based on auth state.

### Step 5 — Build Home Page
StatCard + ParticleBackground + MissionSection + MiniCytoscapeGraph + AnnouncementsList + Carousel + MethodSection.

The mini Cytoscape graph on home renders 5–10 random proteins and their interactions using the `cola` layout.

### Step 6 — Build the Search Results Page (biggest effort)

Priority order:
1. `CytoscapeNetwork` component — wrap Cytoscape.js in `useRef` + `useEffect`. Node and edge styles as described above.
2. `SearchState` with Zustand — `allProteins`, `allInteractions`, filter state
3. `filterProteinsAndInteractions` — derived state computation
4. `NetworkToolbar` with all dropdowns
5. `ResultTablePanel` with all tabs
6. Modal/overlay system
7. Download functions (pure TS, no library needed)

### Step 7 — Cytoscape React Integration Pattern
```tsx
function CytoscapeNetwork({ proteins, interactions, queryIds, layout, theme, onNodeClick }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: buildCytoscapeElements(proteins, interactions, queryIds, theme),
      style: buildCytoscapeStyles(theme),
      layout: { name: layout, avoidOverlap: true, minNodeSpacing: 50 }
    });

    setQueryNodeColors(cyRef.current, queryIds, theme.queryNodeColor);

    return () => cyRef.current?.destroy();
  }, [proteins, interactions, layout]);

  // Re-color on filter changes without full rebuild:
  useEffect(() => {
    if (!cyRef.current) return;
    setQueryNodeColors(cyRef.current, queryIds, theme.queryNodeColor);
  }, [queryIds]);

  return <div ref={containerRef} style={{ height: 760, width: '100%' }} />;
}
```

### Step 8 — Admin Pages
Build last. Use `@tinymce/tinymce-react` for rich text, `react-dropzone` for file uploads, and standard form components for all other admin CRUD.
