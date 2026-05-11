import { describe, it, expect } from 'vitest'
import { formatSIF, formatInteractionsCSV, formatInteractorsCSV, formatFASTA, buildFilename } from './download'
import type { Protein, Interaction } from '../types/api'

const p1: Protein = {
  protein_id: 1, protein_uniprot_id: 'Q92934', protein_ensembl_id: 'ENSG1',
  protein_entrez_id: '572', protein_gene_name: 'BAD', protein_protein_name: 'BAD protein',
  protein_description: 'Apoptosis', protein_sequence: 'MSEQ',
  number_of_interactions_in_database: 12,
  annotation_array: {}, tissue_expression_array: {}, subcellular_location_expression_array: {},
}
const p2: Protein = {
  protein_id: 2, protein_uniprot_id: 'Q07817', protein_ensembl_id: 'ENSG2',
  protein_entrez_id: '598', protein_gene_name: 'BCL2L1', protein_protein_name: 'BCL2L1 protein',
  protein_description: 'Anti-apoptosis', protein_sequence: 'MSEQ2',
  number_of_interactions_in_database: 28,
  annotation_array: {}, tissue_expression_array: {}, subcellular_location_expression_array: {},
}
const interaction: Interaction = {
  interaction_id: 1,
  interactor_A: { protein_id: 1, protein_uniprot_id: 'Q92934', protein_gene_name: 'BAD', protein_ensembl_id: 'ENSG1' },
  interactor_B: { protein_id: 2, protein_uniprot_id: 'Q07817', protein_gene_name: 'BCL2L1', protein_ensembl_id: 'ENSG2' },
  score: 0.82,
  annotation_array: {}, experiment_array: [],
  dataset_array: [{ dataset_reference: '12345', dataset_author: 'Rolland et al.(2014)', year: '2014', description: 'HuRI', interaction_status: 'Published', name: 'HuRI' }],
  interaction_category_array: { highest_category_status: 'Published', highest_order: 1, interaction_category_array: [{ category_name: 'Published', order: 1 }] },
}

describe('formatSIF', () => {
  it('produces tab-separated GeneA pp GeneB lines', () => {
    const result = formatSIF([interaction], [p1, p2])
    expect(result).toBe('BAD\tpp\tBCL2L1\n')
  })
})

describe('formatInteractionsCSV', () => {
  it('has header row with correct columns', () => {
    const result = formatInteractionsCSV([interaction], [p1, p2])
    const lines = result.split('\n')
    expect(lines[0]).toBe('UniProt A,UniProt B,Gene A,Gene B,Ensembl A,Ensembl B,Score,Category,Dataset')
  })

  it('has data row with correct values', () => {
    const result = formatInteractionsCSV([interaction], [p1, p2])
    const lines = result.split('\n')
    expect(lines[1]).toBe('Q92934,Q07817,BAD,BCL2L1,ENSG1,ENSG2,0.82,Published,Rolland et al.(2014)')
  })
})

describe('formatInteractorsCSV', () => {
  it('has header row', () => {
    const result = formatInteractorsCSV([p1])
    const lines = result.split('\n')
    expect(lines[0]).toBe('Gene Name,UniProt ID,Ensembl ID,Entrez ID,Number of Interactions')
  })

  it('has data row with correct values', () => {
    const result = formatInteractorsCSV([p1])
    const lines = result.split('\n')
    expect(lines[1]).toBe('BAD,Q92934,ENSG1,572,12')
  })
})

describe('formatFASTA', () => {
  it('produces correct FASTA format', () => {
    const result = formatFASTA([p1])
    expect(result).toBe('>BAD|Q92934\nMSEQ\n')
  })
})

describe('buildFilename', () => {
  it('starts with HuRI_download_', () => {
    const name = buildFilename('SIF', 'sif')
    expect(name).toMatch(/^HuRI_download_SIF_/)
    expect(name).toMatch(/\.sif$/)
  })
})
