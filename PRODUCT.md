# Product

## Register

product

## Users

Two equally weighted audiences use openPIP, often in different contexts:

**Wet-lab biologists** arrive with a gene name or protein target and want to know
what it interacts with before designing their next experiment. They visit
occasionally, may not know bioinformatics databases well, and will bounce if the
tool is intimidating or slow to answer their question.

**Computational researchers** use openPIP programmatically: they search for
networks, download datasets in bulk, and pipe results into analysis pipelines.
They expect density, precision, and reliable data provenance.

Both groups share one job: find trustworthy protein-protein interaction data
quickly. Credibility matters more than novelty.

## Product Purpose

openPIP is an open-access protein-protein interaction (PPI) database focused on
plant pathogen proteins (originally plant viral proteins, per the Helmy et al.
JMB 2022 paper). It aggregates curated interaction data with evidence-type
classification (published, validated, verified, literature) and exposes it
through search, network visualization (Cytoscape.js), and bulk download.

Success means: a researcher can arrive, search a gene name, see the interaction
network, assess evidence quality, and download or cite the result in under two
minutes.

## Brand Personality

Rigorous, collaborative, accessible.

The tool should feel like a well-maintained research instrument: precise and
trustworthy, but not cold or bureaucratic. Open-science values (transparent
data, community-built, freely available) should be legible in the interface
tone without being performatively stated.

Voice is confident and economical. Labels name things accurately. Errors explain
without blaming. Empty states invite action rather than apologizing.

## Anti-references

- **Legacy NCBI / UCSC aesthetic**: tables without hierarchy, unlabeled controls,
  monospace forms that feel like they predate CSS. openPIP 2.0 must be
  immediately more readable and navigable.
- **Terminal / hacker aesthetic**: dark monospace UI, neon accents, dense
  developer-tool chrome. Wrong register for a scientific database serving
  wet-lab users.
- **Generic SaaS marketing**: pastel hero gradients, rounded everything, copy
  that says "powerful" or "seamless". This is a research tool, not a product
  landing page.
- **Institutional pomposity**: USask / NRNB branding does not mean heavy
  institutional chrome. Affiliation appears once; after that, the data speaks.

## Design Principles

1. **Data first, chrome second.** The interaction network, search results, and
   dataset tables are the product. Navigation and chrome serve them; they never
   compete for visual weight.

2. **Expertise without intimidation.** Dense information for computational
   researchers coexists with clear affordances for wet-lab users visiting for the
   first time. Progressive depth: the useful answer at a glance, the full
   provenance one click deeper.

3. **Evidence quality is visible.** The edge color system (published /
   validated / verified / literature) is not a decoration; it communicates
   scientific confidence. Preserve and reinforce it in every context where
   interactions are shown.

4. **Credibility through clarity.** Trust is earned by information architecture
   and data transparency, not by institutional logos or superlative copy. One
   citation, one source badge, one clean number is worth more than a hero metric.

5. **The interface is a collaborator.** openPIP is community-built and
   open-access. The interface should feel like it was made by scientists for
   scientists: honest about limitations, transparent about data provenance,
   welcoming of contribution.

## Accessibility & Inclusion

Target WCAG 2.1 AAA where feasible. In practice:

- Color contrast at or above 7:1 for body text; 4.5:1 minimum for large
  headings and UI components.
- The Cytoscape.js network graph is a visual-only surface; provide accessible
  tabular alternatives for interaction data (the download and results table serve
  this role).
- Edge colors must remain distinguishable to deuteranopes and protanopes. Use
  shape or pattern cues (dashed/solid, labeled legend) in addition to color.
- Keyboard navigation for all interactive controls (search, filters, admin
  forms).
- Reduced-motion media query honored for all animations and transitions.
- Screen-reader labels on all icon-only buttons and SVG elements.
