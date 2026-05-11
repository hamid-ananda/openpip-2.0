import { describe, it, expect, beforeEach } from 'vitest'
import { useSearchStore } from './searchStore'
import type { SearchResult } from '../../types/search'
import type { Protein } from '../../types/api'

const mockProtein = (id: number, gene: string): Protein => ({
  protein_id: id,
  protein_uniprot_id: `P${id}`,
  protein_ensembl_id: `ENSG${id}`,
  protein_entrez_id: `${id}`,
  protein_gene_name: gene,
  protein_protein_name: gene,
  protein_description: `${gene} protein`,
  protein_sequence: 'MSEQ',
  number_of_interactions_in_database: 5,
  annotation_array: {},
  tissue_expression_array: {},
  subcellular_location_expression_array: {},
})

const mockResult: SearchResult = {
  all_proteins: [mockProtein(1, 'BAD'), mockProtein(2, 'BCL2L1'), mockProtein(3, 'BAK1')],
  all_interactions: [],
  domains: '',
  complexes: '',
  query_protein_id_array: [1, 2],
  search_term: 'BAD,BCL2L1',
  found_protein_summary: 'BAD<br>BCL2L1',
  unfound_protein_summary: '',
}

describe('searchStore', () => {
  beforeEach(() => useSearchStore.setState(useSearchStore.getInitialState()))

  it('starts with empty proteins and interactions', () => {
    expect(useSearchStore.getState().allProteins).toHaveLength(0)
    expect(useSearchStore.getState().allInteractions).toHaveLength(0)
  })

  it('setSearchData populates all fields', () => {
    useSearchStore.getState().setSearchData(mockResult)
    expect(useSearchStore.getState().allProteins).toHaveLength(3)
    expect(useSearchStore.getState().queryProteinIds).toEqual([1, 2])
    expect(useSearchStore.getState().searchTerm).toBe('BAD,BCL2L1')
  })

  it('setScoreFilter updates scoreFilter', () => {
    useSearchStore.getState().setScoreFilter(0.5)
    expect(useSearchStore.getState().scoreFilter).toBe(0.5)
  })

  it('setModal opens and closes', () => {
    useSearchStore.getState().setModal('download')
    expect(useSearchStore.getState().activeModal).toBe('download')
    useSearchStore.getState().setModal(null)
    expect(useSearchStore.getState().activeModal).toBeNull()
  })

  it('setLayout updates selectedLayout', () => {
    useSearchStore.getState().setLayout('circle')
    expect(useSearchStore.getState().selectedLayout).toBe('circle')
  })

  it('reset clears all data', () => {
    useSearchStore.getState().setSearchData(mockResult)
    useSearchStore.getState().reset()
    expect(useSearchStore.getState().allProteins).toHaveLength(0)
    expect(useSearchStore.getState().searchTerm).toBe('')
  })
})
