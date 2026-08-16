import { describe, it, expect } from 'vitest'
import { TISSUE_KEYS, TISSUE_LABELS, tissueLabel } from './tissues'

describe('tissueLabel', () => {
  it('names the brain PCoA clusters instead of numbering them', () => {
    expect(tissueLabel('brain_0')).toBe('Brain basal ganglia')
    expect(tissueLabel('brain_1')).toBe('Brain cerebellum')
    expect(tissueLabel('brain_2')).toBe('Brain other')
  })

  it('never renders a bare cluster index', () => {
    for (const key of TISSUE_KEYS) {
      expect(tissueLabel(key)).not.toMatch(/\d/)
    }
  })

  it('prettifies a tissue it has no label for', () => {
    expect(tissueLabel('bladder_wall')).toBe('Bladder Wall')
  })

  it('covers the 36 tissues openPIP holds', () => {
    // YARN yields 38; openPIP drops the two cell lines. See
    // docs/DATA_PROVENANCE_QUESTIONS.md §2.
    expect(TISSUE_KEYS).toHaveLength(36)
    expect(Object.values(TISSUE_LABELS).every(Boolean)).toBe(true)
  })
})
