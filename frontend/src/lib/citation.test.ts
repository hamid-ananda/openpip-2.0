import { describe, it, expect } from 'vitest'
import {
  referenceHref,
  referenceLabel,
  shortCitation,
  hasCitation,
  toBibTeX,
  citationHeaderLines,
} from './citation'
import { makeDatasetRef } from '../mocks/fixtures/datasetRef'

const HURI = makeDatasetRef({
  id: 1,
  name: 'HuRI',
  pubmed_id: '32296183',
  author: 'Luck et al.',
  year: '2020',
  title: 'A reference map of the human binary protein interactome',
  journal: 'Nature',
  citation:
    'Luck et al. (2020). A reference map of the human binary protein interactome. Nature.',
})

describe('referenceHref', () => {
  it('prefers a DOI over a PubMed ID', () => {
    expect(referenceHref({ ...HURI, doi: '10.1038/x' })).toBe('https://doi.org/10.1038/x')
  })

  it('falls back to PubMed, then a recorded URL, then null', () => {
    expect(referenceHref(HURI)).toBe('https://pubmed.ncbi.nlm.nih.gov/32296183/')
    expect(referenceHref({ url: 'https://example.org/x' })).toBe('https://example.org/x')
    expect(referenceHref({})).toBeNull()
  })
})

describe('referenceLabel', () => {
  it('labels each identifier kind', () => {
    expect(referenceLabel({ doi: '10.1038/x' })).toBe('doi:10.1038/x')
    expect(referenceLabel({ pubmed_id: '123' })).toBe('PubMed 123')
    expect(referenceLabel({})).toBeNull()
  })
})

describe('shortCitation', () => {
  it('combines author and year', () => {
    expect(shortCitation(HURI)).toBe('Luck et al., 2020')
  })

  it('never surfaces the "Unpublished Dataset" placeholder', () => {
    expect(shortCitation(makeDatasetRef({ dataset_author: 'Unpublished Dataset' }))).toBeNull()
  })

  it('falls back to the legacy dataset_author alias', () => {
    expect(shortCitation({ dataset_author: 'Rual et al.', year: '2005' })).toBe(
      'Rual et al., 2005'
    )
  })
})

describe('hasCitation', () => {
  it('is false only when there is nothing to show', () => {
    expect(hasCitation(HURI)).toBe(true)
    expect(hasCitation(makeDatasetRef({ name: 'Test-Space' }))).toBe(false)
  })
})

describe('toBibTeX', () => {
  it('emits an @article when there is a journal', () => {
    const bib = toBibTeX(HURI)
    expect(bib).toContain('@article{openpip_huri_2020,')
    expect(bib).toContain('author = {Luck et al.}')
    expect(bib).toContain('journal = {Nature}')
    expect(bib).toContain('pmid = {32296183}')
    expect(bib.trim().endsWith('}')).toBe(true)
  })

  it('emits an @misc for an unpublished dataset, still citable', () => {
    const bib = toBibTeX(makeDatasetRef({ name: 'Test-Space' }))
    expect(bib).toContain('@misc{openpip_test_space,')
    expect(bib).toContain('title = {Test-Space}')
    expect(bib).toContain('note = {openPIP dataset: Test-Space}')
  })

  it('builds a key safe for BibTeX from an awkward name', () => {
    expect(toBibTeX(makeDatasetRef({ name: 'HI-II/14 (space II)', year: '2014' }))).toContain(
      '@misc{openpip_hi_ii_14_space_ii_2014,'
    )
  })
})

describe('citationHeaderLines', () => {
  it('lists each dataset once, with its reference and link', () => {
    const lines = citationHeaderLines([HURI, HURI])
    expect(lines[0]).toBe('# Data sources — please cite the original publications:')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain('HuRI — Luck et al. (2020)')
    expect(lines[1]).toContain('<https://pubmed.ncbi.nlm.nih.gov/32296183/>')
  })

  it('marks unpublished datasets rather than omitting them', () => {
    const lines = citationHeaderLines([makeDatasetRef({ id: 9, name: 'Test-Space' })])
    expect(lines[1]).toContain('Test-Space — unpublished dataset')
  })

  it('returns nothing when there are no datasets', () => {
    expect(citationHeaderLines([])).toEqual([])
  })

  it('emits only comment lines, so exports stay re-importable', () => {
    expect(citationHeaderLines([HURI]).every((l) => l.startsWith('#'))).toBe(true)
  })
})
