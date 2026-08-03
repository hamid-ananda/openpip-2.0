import { describe, expect, it } from 'vitest'
import { computeSequenceStats, toFasta } from '../sequenceStats'

describe('computeSequenceStats', () => {
  it('counts residues and ignores non-letter characters', () => {
    const stats = computeSequenceStats('MK RA\nY')
    expect(stats.length).toBe(5)
  })

  it('computes the molecular weight of a known peptide', () => {
    // Glycylglycine: two glycine residues plus one water.
    const stats = computeSequenceStats('GG')
    expect(stats.molecularWeight).toBeCloseTo(132.12, 1)
  })

  it('puts an acidic peptide below pH 7 and a basic one above', () => {
    const acidic = computeSequenceStats('DDDEEE')
    const basic = computeSequenceStats('KKKRRR')
    expect(acidic.isoelectricPoint).toBeLessThan(7)
    expect(basic.isoelectricPoint).toBeGreaterThan(9)
  })

  it('reports composition ordered by count', () => {
    const stats = computeSequenceStats('AAAGG')
    expect(stats.composition[0]).toEqual({ residue: 'A', count: 3, fraction: 3 / 5 })
    expect(stats.composition[1].residue).toBe('G')
  })

  it('returns nulls rather than NaN for a sequence with no known residues', () => {
    const stats = computeSequenceStats('')
    expect(stats.molecularWeight).toBeNull()
    expect(stats.isoelectricPoint).toBeNull()
    expect(stats.composition).toEqual([])
  })
})

describe('toFasta', () => {
  it('writes a header and wraps the sequence at 60 columns', () => {
    const sequence = 'A'.repeat(130)
    const lines = toFasta(sequence, 'TP53', 'P04637').split('\n')
    expect(lines[0]).toBe('>TP53|P04637')
    expect(lines[1]).toHaveLength(60)
    expect(lines[3]).toHaveLength(10)
  })

  it('falls back to the accession when there is no gene name', () => {
    expect(toFasta('MK', '', 'P04637').split('\n')[0]).toBe('>P04637|P04637')
  })
})
