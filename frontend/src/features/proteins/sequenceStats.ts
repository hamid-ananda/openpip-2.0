/**
 * Client-side sequence properties.
 *
 * Molecular weight uses average residue masses; isoelectric point uses the
 * EMBOSS pKa set and a bisection search, matching the method ExPASy ProtParam
 * documents. Values are indicative — cite UniProt, not this, in a paper.
 */

/** Average residue masses in daltons (monomer mass minus one water). */
const RESIDUE_MASS: Record<string, number> = {
  A: 71.0788,
  R: 156.1875,
  N: 114.1038,
  D: 115.0886,
  C: 103.1388,
  E: 129.1155,
  Q: 128.1307,
  G: 57.0519,
  H: 137.1411,
  I: 113.1594,
  L: 113.1594,
  K: 128.1741,
  M: 131.1926,
  F: 147.1766,
  P: 97.1167,
  S: 87.0782,
  T: 101.1051,
  W: 186.2132,
  Y: 163.176,
  V: 99.1326,
}

const WATER_MASS = 18.01528

/** EMBOSS pKa values for the ionisable groups. */
const PKA_N_TERM = 8.6
const PKA_C_TERM = 3.6
const PKA_POSITIVE: Record<string, number> = { K: 10.8, R: 12.5, H: 6.5 }
const PKA_NEGATIVE: Record<string, number> = { D: 3.9, E: 4.1, C: 8.5, Y: 10.1 }

export interface SequenceStats {
  length: number
  /** Molecular weight in daltons, or null when no residue is recognised. */
  molecularWeight: number | null
  /** Isoelectric point, or null when no residue is recognised. */
  isoelectricPoint: number | null
  /** Residue counts, highest first. */
  composition: { residue: string; count: number; fraction: number }[]
}

function cleanSequence(sequence: string): string {
  return (sequence || '').toUpperCase().replace(/[^A-Z]/g, '')
}

/** Net charge of the peptide at a given pH. */
function netCharge(counts: Record<string, number>, pH: number): number {
  let charge = 1 / (1 + 10 ** (pH - PKA_N_TERM))
  for (const [residue, pKa] of Object.entries(PKA_POSITIVE)) {
    charge += (counts[residue] || 0) / (1 + 10 ** (pH - pKa))
  }

  charge -= 1 / (1 + 10 ** (PKA_C_TERM - pH))
  for (const [residue, pKa] of Object.entries(PKA_NEGATIVE)) {
    charge -= (counts[residue] || 0) / (1 + 10 ** (pKa - pH))
  }

  return charge
}

export function computeSequenceStats(sequence: string): SequenceStats {
  const residues = cleanSequence(sequence)

  const counts: Record<string, number> = {}
  for (const residue of residues) {
    counts[residue] = (counts[residue] || 0) + 1
  }

  const known = residues.split('').filter((r) => r in RESIDUE_MASS)
  if (known.length === 0) {
    return {
      length: residues.length,
      molecularWeight: null,
      isoelectricPoint: null,
      composition: [],
    }
  }

  const molecularWeight =
    known.reduce((total, residue) => total + RESIDUE_MASS[residue], 0) + WATER_MASS

  // Bisect on pH until the net charge crosses zero. 40 halvings of [0, 14]
  // resolves well past the two decimals we display.
  let low = 0
  let high = 14
  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2
    if (netCharge(counts, mid) > 0) low = mid
    else high = mid
  }
  const isoelectricPoint = (low + high) / 2

  const composition = Object.entries(counts)
    .map(([residue, count]) => ({
      residue,
      count,
      fraction: count / residues.length,
    }))
    .sort((a, b) => b.count - a.count || a.residue.localeCompare(b.residue))

  return { length: residues.length, molecularWeight, isoelectricPoint, composition }
}

/** Wrap a sequence into a FASTA record with the conventional 60-column lines. */
export function toFasta(sequence: string, geneName: string, uniprotId: string): string {
  const header = `>${geneName || uniprotId || 'protein'}|${uniprotId}`
  const wrapped = cleanSequence(sequence).match(/.{1,60}/g)?.join('\n') ?? sequence
  return `${header}\n${wrapped}`
}
