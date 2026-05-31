import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useSearch } from '../../api/search'
import { useSearchStore } from './searchStore'
import { filterProteinsAndInteractions } from './filterInteractions'
import { CytoscapeNetwork } from './network/CytoscapeNetwork'
import { ResultTablePanel } from './tables/ResultTablePanel'
import { EnrichmentPanel } from './enrichment/EnrichmentPanel'
import { OverlaySystem } from './modals/OverlaySystem'
import { SearchSidebar } from './SearchSidebar'
import { NodeInfoPanel } from './NodeInfoPanel'
import type { Protein } from '../../types/api'

const MIN_NETWORK_H = 150
const MAX_NETWORK_H = window.innerHeight - 56 - 120

export function SearchResultsPage() {
  const { term = '' } = useParams<{ term: string }>()
  const [networkHeight, setNetworkHeight] = useState(500)
  const [selectedProtein, setSelectedProtein] = useState<Protein | null>(null)
  // Removed nodes are scoped to the current search term — automatically clears on new search
  const [removed, setRemoved] = useState<{ term: string; ids: number[] }>({ term: '', ids: [] })
  const removedProteinIds = removed.term === term ? removed.ids : []
  const handleNodeClick = useCallback((p: Protein) => setSelectedProtein(p), [])
  const handleRemoveNode = useCallback((id: number) => {
    setRemoved((prev) => ({ term, ids: [...(prev.term === term ? prev.ids : []), id] }))
    setSelectedProtein(null)
  }, [term])

  function startDrag(e: React.MouseEvent) {
    e.preventDefault()
    const startY = e.clientY
    const startH = networkHeight

    const onMove = (ev: MouseEvent) => {
      const next = Math.min(MAX_NETWORK_H, Math.max(MIN_NETWORK_H, startH + ev.clientY - startY))
      setNetworkHeight(next)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }
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
    tissueFilter,
  } = useSearchStore()

  useEffect(() => {
    if (data) setSearchData(data)
  }, [data, setSearchData])

const { proteins: filteredProteins, interactions } = filterProteinsAndInteractions(
    allProteins,
    allInteractions,
    { scoreFilter, categoryFilter, annotationFilter, filterMode, tissueFilter },
    queryProteinIds
  )
  const proteins = removedProteinIds.length
    ? filteredProteins.filter((p) => !removedProteinIds.includes(p.protein_id))
    : filteredProteins

  const visibleInteractionIds = interactions.map((ix) => ix.interaction_id)

  const geneNames = proteins.map((p) => p.protein_gene_name)

  const renderMain = () => {
    if (!term) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: 400,
          gap: 8,
          padding: 48,
        }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>
            Search for a protein to see its interaction network.
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Enter a gene symbol or UniProt ID in the panel on the left.
          </div>
        </div>
      )
    }

    if (isLoading) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: 400,
          gap: 20,
        }}>
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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: 400,
          gap: 6,
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Could not reach the database.</div>
          <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>Check your connection and try again.</div>
        </div>
      )
    }

    return (
      <>
        {/* Network */}
        <div style={{ position: 'relative' }}>
          <CytoscapeNetwork
            proteins={proteins}
            interactions={interactions}
            queryProteinIds={queryProteinIds}
            layout={selectedLayout}
            height={networkHeight}
            onNodeClick={handleNodeClick}
          />
          {selectedProtein && (
            <NodeInfoPanel
              protein={selectedProtein}
              networkInteractions={interactions}
              searchTerm={term}
              onClose={() => setSelectedProtein(null)}
              onRemove={handleRemoveNode}
            />
          )}
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={startDrag}
          title="Drag to resize"
          style={{
            height: 10,
            flexShrink: 0,
            cursor: 'row-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            userSelect: 'none',
          }}
        >
          <svg width="20" height="6" viewBox="0 0 20 6" fill="none" aria-hidden="true">
            <circle cx="4"  cy="3" r="1.5" fill="var(--text-soft)" />
            <circle cx="10" cy="3" r="1.5" fill="var(--text-soft)" />
            <circle cx="16" cy="3" r="1.5" fill="var(--text-soft)" />
          </svg>
        </div>

        {/* Tables */}
        <ResultTablePanel />

        {/* Enrichment */}
        <EnrichmentPanel geneNames={geneNames} />

        {/* Modals */}
        <OverlaySystem />
      </>
    )
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
      {/* Sidebar — left */}
      <SearchSidebar key={term} term={term} visibleInteractionIds={visibleInteractionIds} />

      {/* Main — scrolls vertically */}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0, background: 'var(--bg)' }}>
        {renderMain()}
      </main>
    </div>
  )
}
