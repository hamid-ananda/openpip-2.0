import { describe, it, expect } from 'vitest'
import { looksLikeGeneList, parseNaturalQuery } from './naturalQuery'

describe('looksLikeGeneList', () => {
  it.each(['TP53', 'TP53, MDM2', 'TP53\nMDM2', '  BRCA1  ', ''])(
    'leaves %j alone as an ordinary search',
    (input) => {
      expect(looksLikeGeneList(input)).toBe(true)
      expect(parseNaturalQuery(input)).toBeNull()
    }
  )

  it('treats a phrase as something to parse', () => {
    expect(looksLikeGeneList('BCL2 in liver')).toBe(false)
  })
})

describe('parseNaturalQuery', () => {
  it('pulls the gene out of a sentence', () => {
    expect(parseNaturalQuery('interactions of BCL2')?.term).toBe('BCL2')
  })

  it('keeps gene symbols in their original case', () => {
    // Matching is lowercased; the term must not come back as "bcl2".
    expect(parseNaturalQuery('what binds BCL2')?.term).toBe('BCL2')
  })

  it('recognises a tissue and reports it', () => {
    const parsed = parseNaturalQuery('BCL2 in liver')
    expect(parsed?.term).toBe('BCL2')
    expect(parsed?.tissues).toEqual(['liver'])
    expect(parsed?.applied).toContain('expressed in Liver')
  })

  it('prefers the longer tissue name', () => {
    // "brain cerebellum" must not match as bare "brain", which is not a tissue
    // key at all — the three brain clusters are separate.
    const parsed = parseNaturalQuery('TP53 in brain cerebellum')
    expect(parsed?.tissues).toEqual(['brain_1'])
  })

  it('reads an explicit score threshold', () => {
    const parsed = parseNaturalQuery('BCL2 with score above 0.8')
    expect(parsed?.minScore).toBe(0.8)
    expect(parsed?.term).toBe('BCL2')
  })

  it('reads a described confidence', () => {
    expect(parseNaturalQuery('BCL2 high confidence')?.minScore).toBe(0.5)
  })

  it('handles a tissue and a score together', () => {
    const parsed = parseNaturalQuery('BCL2 in liver with score above 0.6')
    expect(parsed?.term).toBe('BCL2')
    expect(parsed?.tissues).toEqual(['liver'])
    expect(parsed?.minScore).toBe(0.6)
  })

  it('keeps several genes', () => {
    const parsed = parseNaturalQuery('interactions between TP53 and MDM2')
    expect(parsed?.term).toBe('TP53, MDM2')
  })

  it('says what it cannot honour instead of ignoring it silently', () => {
    // We cannot query detection method, so the user must be told rather than
    // shown BCL2 results that quietly are not restricted to two-hybrid.
    const parsed = parseNaturalQuery('two-hybrid interactions of BCL2')
    expect(parsed?.term).toBe('BCL2')
    expect(parsed?.ignored).toContain('detection method')
  })

  it('reports an unhonoured role filter', () => {
    expect(parseNaturalQuery('interactions where BCL2 was bait')?.ignored).toContain(
      'experimental role'
    )
  })

  it('does not invent filters from an ordinary phrase', () => {
    const parsed = parseNaturalQuery('show me BCL2 interactions')
    expect(parsed?.tissues).toEqual([])
    expect(parsed?.minScore).toBeNull()
    expect(parsed?.ignored).toEqual([])
  })

  it('leaves an unrecognised word in the search term rather than dropping it', () => {
    // Better to search for it and find nothing than to silently discard part of
    // what was asked.
    expect(parseNaturalQuery('BCL2 and WIBBLE')?.term).toBe('BCL2, WIBBLE')
  })
})
