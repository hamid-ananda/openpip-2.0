import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useSearch } from '../../api/search'
import { useSearchStore } from './searchStore'
import { filterProteinsAndInteractions } from './filterInteractions'
import { CytoscapeNetwork } from './network/CytoscapeNetwork'
import { NetworkToolbar } from './toolbar/NetworkToolbar'
import { ResultTablePanel } from './tables/ResultTablePanel'
import { EnrichmentPanel } from './enrichment/EnrichmentPanel'
import { OverlaySystem } from './modals/OverlaySystem'

export function SearchResultsPage() {
  const { term = '' } = useParams<{ term: string }>()
  const { data, isLoading, isError } = useSearch(term)

  const {
    setSearchData,
    allProteins,
    allInteractions,
    queryProteinIds,
    selectedLayout,
    scoreFilter,
    categoryFilter,
    annotationFilter,
    filterMode,
    tissueExpressionActive,
    tissueSpecificityActive,
    foundSummary,
    unfoundSummary,
    searchTerm,
  } = useSearchStore()

  // Load search data into store when query completes
  useEffect(() => {
    if (data) setSearchData(data)
  }, [data, setSearchData])

  // Derive filtered proteins and interactions for the network view
  const { proteins, interactions } = filterProteinsAndInteractions(
    allProteins,
    allInteractions,
    {
      scoreFilter,
      categoryFilter,
      annotationFilter,
      filterMode,
      tissueExpressionActive,
      tissueSpecificityActive,
    },
    queryProteinIds
  )

  // Gene names for enrichment
  const geneNames = proteins.map((p) => p.protein_gene_name)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-main)' }}
        />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load search results. Please try again.
      </div>
    )
  }

  if (!term) {
    return (
      <div className="p-8 text-center text-gray-500">Enter a search term to see results.</div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Summary bar */}
      {foundSummary && (
        <div className="text-sm text-gray-700">
          <span className="font-medium">Found: </span>
          <span dangerouslySetInnerHTML={{ __html: foundSummary }} />
          {unfoundSummary && (
            <span className="ml-4 text-amber-700">
              <span className="font-medium">Not found: </span>
              {unfoundSummary}
            </span>
          )}
        </div>
      )}

      {/* Toolbar */}
      <NetworkToolbar searchTerm={searchTerm} />

      {/* Network visualization */}
      <CytoscapeNetwork
        proteins={proteins}
        interactions={interactions}
        queryProteinIds={queryProteinIds}
        layout={selectedLayout}
      />

      {/* Data tables */}
      <ResultTablePanel />

      {/* Enrichment */}
      <EnrichmentPanel geneNames={geneNames} />

      {/* Modals */}
      <OverlaySystem />
    </div>
  )
}
