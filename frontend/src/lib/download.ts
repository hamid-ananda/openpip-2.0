import type { Protein, Interaction } from '../types/api'

function getProteinMap(proteins: Protein[]): Map<number, Protein> {
  return new Map(proteins.map((p) => [p.protein_id, p]))
}

export function formatSIF(interactions: Interaction[], proteins: Protein[]): string {
  const pm = getProteinMap(proteins)
  return interactions
    .map((i) => {
      const geneA = pm.get(i.interactor_A.protein_id)?.protein_gene_name ?? i.interactor_A.protein_gene_name
      const geneB = pm.get(i.interactor_B.protein_id)?.protein_gene_name ?? i.interactor_B.protein_gene_name
      return `${geneA}\tpp\t${geneB}`
    })
    .join('\n') + '\n'
}

export function formatInteractionsCSV(interactions: Interaction[], proteins: Protein[]): string {
  const pm = getProteinMap(proteins)
  const header = 'UniProt A,UniProt B,Gene A,Gene B,Ensembl A,Ensembl B,Score,Category,Dataset'
  const rows = interactions.map((i) => {
    const pA = pm.get(i.interactor_A.protein_id)
    const pB = pm.get(i.interactor_B.protein_id)
    const dataset = i.dataset_array[0]?.dataset_author ?? ''
    return [
      i.interactor_A.protein_uniprot_id,
      i.interactor_B.protein_uniprot_id,
      pA?.protein_gene_name ?? i.interactor_A.protein_gene_name,
      pB?.protein_gene_name ?? i.interactor_B.protein_gene_name,
      pA?.protein_ensembl_id ?? i.interactor_A.protein_ensembl_id,
      pB?.protein_ensembl_id ?? i.interactor_B.protein_ensembl_id,
      i.score ?? '',
      i.interaction_category_array.highest_category_status,
      dataset,
    ].join(',')
  })
  return [header, ...rows].join('\n')
}

export function formatInteractorsCSV(proteins: Protein[]): string {
  const header = 'Gene Name,UniProt ID,Ensembl ID,Entrez ID,Number of Interactions'
  const rows = proteins.map((p) =>
    [p.protein_gene_name, p.protein_uniprot_id, p.protein_ensembl_id, p.protein_entrez_id, p.number_of_interactions_in_database].join(',')
  )
  return [header, ...rows].join('\n')
}

export function formatFASTA(proteins: Protein[]): string {
  return proteins
    .map((p) => `>${p.protein_gene_name}|${p.protein_uniprot_id}\n${p.protein_sequence}\n`)
    .join('')
}

export function formatPSIMI(interactions: Interaction[], proteins: Protein[]): string {
  const pm = getProteinMap(proteins)
  const cols42 = Array(42).fill('-')
  const rows = interactions.map((i) => {
    const pA = pm.get(i.interactor_A.protein_id)
    const pB = pm.get(i.interactor_B.protein_id)
    const row = [...cols42]
    row[0] = `uniprotkb:${i.interactor_A.protein_uniprot_id}`
    row[1] = `uniprotkb:${i.interactor_B.protein_uniprot_id}`
    row[4] = pA?.protein_gene_name ? `uniprotkb:${pA.protein_gene_name}(gene name)` : '-'
    row[5] = pB?.protein_gene_name ? `uniprotkb:${pB.protein_gene_name}(gene name)` : '-'
    row[14] = i.score != null ? `${i.score}` : '-'
    return row.join('\t')
  })
  return rows.join('\n') + '\n'
}

export function buildFilename(format: string, ext: string): string {
  const now = new Date()
  const month = now.toLocaleString('default', { month: 'long' })
  const day = now.getDate()
  const year = now.getFullYear()
  const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
  return `openPIP_download_${format}_${month}_${day}_${year}_${time}.${ext}`
}

export function downloadFile(filename: string, content: string): void {
  const a = document.createElement('a')
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
