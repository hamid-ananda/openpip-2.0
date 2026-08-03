import type { ProteinDetail } from '../../api/proteins'
import { computeSequenceStats } from './sequenceStats'

/** Escape a value for a TSV cell — tabs and newlines would break the row. */
function tsvCell(value: unknown): string {
  return String(value ?? '')
    .replace(/[\t\r\n]+/g, ' ')
    .trim()
}

export function formatProteinJSON(protein: ProteinDetail): string {
  const stats = computeSequenceStats(protein.protein_sequence)
  return JSON.stringify(
    {
      ...protein,
      computed: {
        sequence_length: stats.length,
        molecular_weight_da: stats.molecularWeight,
        isoelectric_point: stats.isoelectricPoint,
      },
    },
    null,
    2
  )
}

export function formatProteinTSV(protein: ProteinDetail): string {
  const stats = computeSequenceStats(protein.protein_sequence)
  const rows: [string, unknown][] = [
    ['gene_name', protein.protein_gene_name],
    ['protein_name', protein.protein_protein_name],
    ['uniprot_id', protein.protein_uniprot_id],
    ['ensembl_id', protein.protein_ensembl_id],
    ['entrez_id', protein.protein_entrez_id],
    ['description', protein.protein_description],
    ['interactions_in_database', protein.number_of_interactions_in_database],
    ['sequence_length', stats.length],
    ['molecular_weight_da', stats.molecularWeight?.toFixed(2) ?? ''],
    ['isoelectric_point', stats.isoelectricPoint?.toFixed(2) ?? ''],
    ['sequence', protein.protein_sequence],
  ]

  for (const [type, values] of Object.entries(protein.annotation_array)) {
    rows.push([`annotation:${type}`, values.join('; ')])
  }

  return ['field\tvalue', ...rows.map(([k, v]) => `${k}\t${tsvCell(v)}`)].join('\n') + '\n'
}

/** Filename stem for downloads — gene name where known, else the accession. */
export function proteinFileStem(protein: ProteinDetail): string {
  const name =
    protein.protein_gene_name || protein.protein_uniprot_id || `protein_${protein.protein_id}`
  return `openPIP_${name.replace(/[^A-Za-z0-9_-]/g, '_')}`
}
