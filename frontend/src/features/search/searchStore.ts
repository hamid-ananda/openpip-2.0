import { create } from 'zustand'
import type { Protein, Interaction } from '../../types/api'
import type { SearchResult } from '../../types/search'

type LayoutName = 'cola' | 'cose' | 'concentric' | 'circle' | 'grid'
type ModalName = 'download' | 'downloadAuth' | 'cyRest' | 'loading' | 'directDownload'

interface SearchState {
  allProteins: Protein[]
  allInteractions: Interaction[]
  queryProteinIds: number[]
  searchTerm: string
  foundSummary: string
  unfoundSummary: string
  scoreFilter: number
  categoryFilter: Record<string, boolean>
  annotationFilter: Record<string, boolean>
  filterMode: 'None' | 'query_query' | 'query_interactor'
  tissueExpressionActive: boolean
  tissueSpecificityActive: boolean
  selectedLayout: LayoutName
  activeModal: ModalName | null
  activeTableTab: string
  setSearchData: (result: SearchResult) => void
  setScoreFilter: (n: number) => void
  setCategoryFilter: (name: string, val: boolean) => void
  setAnnotationFilter: (name: string, val: boolean) => void
  setFilterMode: (mode: 'None' | 'query_query' | 'query_interactor') => void
  setLayout: (name: LayoutName) => void
  setModal: (name: ModalName | null) => void
  setTableTab: (name: string) => void
  reset: () => void
}

const initialState = {
  allProteins: [] as Protein[],
  allInteractions: [] as Interaction[],
  queryProteinIds: [] as number[],
  searchTerm: '',
  foundSummary: '',
  unfoundSummary: '',
  scoreFilter: 0,
  categoryFilter: {
    Published: true,
    Validated: true,
    Verified: true,
    Literature: true,
  } as Record<string, boolean>,
  annotationFilter: {} as Record<string, boolean>,
  filterMode: 'None' as const,
  tissueExpressionActive: false,
  tissueSpecificityActive: false,
  selectedLayout: 'cola' as LayoutName,
  activeModal: null as ModalName | null,
  activeTableTab: 'interactions',
}

export const useSearchStore = create<SearchState>()((set) => ({
  ...initialState,
  setSearchData: (result) =>
    set((s) => {
      const categoryFilter = { ...s.categoryFilter }
      for (const ix of result.all_interactions) {
        const cat = ix.interaction_category_array.highest_category_status
        if (cat && !(cat in categoryFilter)) categoryFilter[cat] = true
      }
      return {
        allProteins: result.all_proteins,
        allInteractions: result.all_interactions,
        queryProteinIds: result.query_protein_id_array,
        searchTerm: result.search_term,
        foundSummary: result.found_protein_summary,
        unfoundSummary: result.unfound_protein_summary,
        categoryFilter,
      }
    }),
  setScoreFilter: (n) => set({ scoreFilter: n }),
  setCategoryFilter: (name, val) =>
    set((s) => ({ categoryFilter: { ...s.categoryFilter, [name]: val } })),
  setAnnotationFilter: (name, val) =>
    set((s) => ({ annotationFilter: { ...s.annotationFilter, [name]: val } })),
  setFilterMode: (mode) => set({ filterMode: mode }),
  setLayout: (name) => set({ selectedLayout: name }),
  setModal: (name) => set({ activeModal: name }),
  setTableTab: (name) => set({ activeTableTab: name }),
  reset: () => set(initialState),
}))

// Static method for test resets — exposes initial state snapshot
;(useSearchStore as unknown as { getInitialState: () => typeof initialState }).getInitialState =
  () => ({ ...initialState })
