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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 20 }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--primary)',
          animation: 'spin .8s linear infinite',
        }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
            {term}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Querying interactome...
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ padding: '80px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
          Could not reach the database.
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>
          Check your connection and try the search again.
        </div>
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
