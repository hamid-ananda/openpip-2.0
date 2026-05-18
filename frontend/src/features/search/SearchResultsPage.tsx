import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSearch } from '../../api/search'
import { useSearchStore } from './searchStore'
import { filterProteinsAndInteractions } from './filterInteractions'
import { CytoscapeNetwork } from './network/CytoscapeNetwork'
import { ResultTablePanel } from './tables/ResultTablePanel'
import { EnrichmentPanel } from './enrichment/EnrichmentPanel'
import { OverlaySystem } from './modals/OverlaySystem'
import { SearchSidebar } from './SearchSidebar'
import type { Protein } from '../../types/api'

const MIN_NETWORK_H = 150
const MAX_NETWORK_H = window.innerHeight - 56 - 120 // leave room for at least one table row

function NodeInfoPanel({ protein, onClose }: { protein: Protein; onClose: () => void }) {
  const navigate = useNavigate()
  const isQuery = protein.protein_gene_name || protein.protein_uniprot_id
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, zIndex: 20,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px 18px', width: 240,
      boxShadow: '0 4px 16px rgba(0,0,0,.12)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
            {protein.protein_gene_name || protein.protein_uniprot_id || '—'}
          </div>
          {protein.protein_protein_name && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {protein.protein_protein_name.length > 40
                ? protein.protein_protein_name.slice(0, 40) + '…'
                : protein.protein_protein_name}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: '0 0 0 8px', lineHeight: 1 }}
          aria-label="Close"
        >×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, fontSize: 12 }}>
        {protein.protein_uniprot_id && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>UniProt</span>
            <a href={`https://www.uniprot.org/uniprot/${protein.protein_uniprot_id}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontFamily: 'var(--mono)' }}>
              {protein.protein_uniprot_id}
            </a>
          </div>
        )}
        {protein.protein_ensembl_id && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Ensembl</span>
            <span style={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 11 }}>{protein.protein_ensembl_id}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Interactions</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{protein.number_of_interactions_in_database}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {isQuery && (
          <Link
            to={`/protein/${encodeURIComponent(protein.protein_gene_name || protein.protein_uniprot_id)}`}
            className="op-btn primary"
            style={{ fontSize: 12, padding: '7px 12px', textAlign: 'center', textDecoration: 'none' }}
          >
            View full details →
          </Link>
        )}
        <button
          className="op-btn"
          style={{ fontSize: 12, padding: '7px 12px' }}
          onClick={() => {
            onClose()
            navigate(`/search/${encodeURIComponent(protein.protein_gene_name || protein.protein_uniprot_id || '')}`)
          }}
        >
          Search interactions →
        </button>
      </div>
    </div>
  )
}

export function SearchResultsPage() {
  const { term = '' } = useParams<{ term: string }>()
  const [networkHeight, setNetworkHeight] = useState(500)
  const [selectedProtein, setSelectedProtein] = useState<Protein | null>(null)
  const handleNodeClick = useCallback((p: Protein) => setSelectedProtein(p), [])

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
    tissueExpressionActive,
    tissueSpecificityActive,
  } = useSearchStore()

  useEffect(() => {
    if (data) setSearchData(data)
  }, [data, setSearchData])

  const { proteins, interactions } = filterProteinsAndInteractions(
    allProteins,
    allInteractions,
    { scoreFilter, categoryFilter, annotationFilter, filterMode, tissueExpressionActive, tissueSpecificityActive },
    queryProteinIds
  )

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
            <NodeInfoPanel protein={selectedProtein} onClose={() => setSelectedProtein(null)} />
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
      <SearchSidebar key={term} term={term} />

      {/* Main — scrolls vertically */}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {renderMain()}
      </main>
    </div>
  )
}
