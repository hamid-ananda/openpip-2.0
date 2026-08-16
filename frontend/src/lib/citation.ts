import type { DatasetRef } from '../types/api'

/**
 * Shared rendering of dataset citations.
 *
 * The About page, the Downloads page, the network's edge panel and the export
 * headers all show the same reference, so the formatting lives here rather
 * than being reinvented slightly differently in each of them.
 */

/** Where a reader should be sent for the source publication. */
export function referenceHref(ds: Partial<DatasetRef>): string | null {
  if (ds.doi) return `https://doi.org/${ds.doi}`
  if (ds.pubmed_id) return `https://pubmed.ncbi.nlm.nih.gov/${ds.pubmed_id}/`
  return ds.url || null
}

/** How to label that link: `doi:10.…` or `PubMed 25416956`. */
export function referenceLabel(ds: Partial<DatasetRef>): string | null {
  if (ds.doi) return `doi:${ds.doi}`
  if (ds.pubmed_id) return `PubMed ${ds.pubmed_id}`
  return ds.url ? 'Source' : null
}

/**
 * A compact `Author, Year` for tight spaces like the edge panel.
 *
 * Falls back to the legacy `dataset_author` alias, which older API consumers
 * still populate, and returns null for genuinely unpublished datasets rather
 * than the literal string "Unpublished Dataset".
 */
export function shortCitation(ds: Partial<DatasetRef>): string | null {
  const author =
    ds.author || (ds.dataset_author !== 'Unpublished Dataset' ? ds.dataset_author : null)
  if (!author) return null
  return ds.year ? `${author}, ${ds.year}` : author
}

/**
 * PSI-MI TAB column 8: `Surname-Year`, e.g. `Rolland-2014`.
 *
 * Mirrors the backend's PSICQUIC formatting so an export and a PSICQUIC query
 * describe the same interaction identically.
 */
export function tabAuthorYear(ds: Partial<DatasetRef>): string {
  const author = ds.author || (ds.dataset_author !== 'Unpublished Dataset' ? ds.dataset_author : null)
  if (!author) return '-'
  const surname = author.split(/\s+/)[0].replace(/,$/, '')
  return ds.year ? `${surname}-${ds.year}` : surname
}

/** True when there is any publication information worth showing. */
export function hasCitation(ds: Partial<DatasetRef>): boolean {
  return Boolean(ds.citation || shortCitation(ds))
}

/** A stable, quotable BibTeX key: `openpip_huri_2020`. */
function bibtexKey(ds: Partial<DatasetRef>): string {
  const slug = (ds.name || 'dataset')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
  return ds.year ? `openpip_${slug}_${ds.year}` : `openpip_${slug}`
}

/**
 * Render a dataset as a BibTeX entry.
 *
 * `@article` when there is a journal to cite, `@misc` otherwise — an
 * unpublished screen is still citable as a dataset, just not as a paper.
 */
export function toBibTeX(ds: Partial<DatasetRef>): string {
  const fields: [string, string][] = []
  if (ds.author) fields.push(['author', ds.author])
  if (ds.title) fields.push(['title', ds.title])
  if (ds.journal) fields.push(['journal', ds.journal])
  if (ds.year) fields.push(['year', ds.year])
  if (ds.doi) fields.push(['doi', ds.doi])
  if (ds.pubmed_id) fields.push(['pmid', ds.pubmed_id])

  const href = referenceHref(ds)
  if (href) fields.push(['url', href])

  const type = ds.journal ? 'article' : 'misc'
  if (type === 'misc') {
    fields.push(['note', `openPIP dataset: ${ds.name ?? 'unnamed'}`])
    if (!ds.title && ds.name) fields.unshift(['title', ds.name])
  }

  const body = fields.map(([k, v]) => `  ${k} = {${v}}`).join(',\n')
  return `@${type}{${bibtexKey(ds)},\n${body}\n}`
}

/**
 * Comment lines naming the datasets an export drew from.
 *
 * Prefixed with `#` so they are valid leading comments in PSI-MI TAB and are
 * skipped by our own upload parser on re-import.
 */
export function citationHeaderLines(datasets: Partial<DatasetRef>[]): string[] {
  const seen = new Map<string, Partial<DatasetRef>>()
  for (const ds of datasets) {
    const key = String(ds.id ?? ds.name ?? '')
    if (key && !seen.has(key)) seen.set(key, ds)
  }
  if (!seen.size) return []

  const lines = ['# Data sources — please cite the original publications:']
  for (const ds of seen.values()) {
    const reference = ds.citation || shortCitation(ds)
    const href = referenceHref(ds)
    lines.push(
      `#   ${ds.name}${reference ? ` — ${reference}` : ' — unpublished dataset'}` +
        (href ? ` <${href}>` : '')
    )
  }
  return lines
}
