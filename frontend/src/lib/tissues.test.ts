import { describe, it, expect } from 'vitest'
import { TISSUE_LABELS, tissueLabel } from './tissues'

describe('tissueLabel', () => {
  it('names the brain PCoA clusters instead of numbering them', () => {
    expect(tissueLabel('brain_0')).toBe('Brain basal ganglia')
    expect(tissueLabel('brain_1')).toBe('Brain cerebellum')
    expect(tissueLabel('brain_2')).toBe('Brain other')
  })

  it('never renders a bare cluster index', () => {
    for (const key of Object.keys(TISSUE_LABELS)) {
      expect(tissueLabel(key)).not.toMatch(/\d/)
    }
  })

  it('prettifies a tissue it has no label for', () => {
    expect(tissueLabel('bladder_wall')).toBe('Bladder Wall')
  })
})
