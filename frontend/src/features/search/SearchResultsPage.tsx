import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSearch } from '../../api/search'
import { useSearchStore } from './searchStore'
import { filterProteinsAndInteractions } from './filterInteractions'
import { CytoscapeNetwork } from './network/CytoscapeNetwork'
import { ResultTablePanel } from './tables/ResultTablePanel'
import { EnrichmentPanel } from './enrichment/EnrichmentPanel'
import { OverlaySystem } from './modals/OverlaySystem'
import { SearchSidebar } from './SearchSidebar'
import type { Protein, Interaction } from '../../types/api'

const MIN_NETWORK_H = 150
const MAX_NETWORK_H = window.innerHeight - 56 - 120

// ─── Node info popup — matches legacy protein popup ────────────────────────

const SECTION = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '.07em', marginBottom: 6, marginTop: 14 }
const EXT_LINK = { fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }

interface NodeInfoPanelProps {
  protein: Protein
  networkInteractions: Interaction[]
  searchTerm: string
  onClose: () => void
  onRemove: (id: number) => void
}

function NodeInfoPanel({ protein, networkInteractions, searchTerm, onClose, onRemove }: NodeInfoPanelProps) {
  const navigate = useNavigate()
  const gene = protein.protein_gene_name || protein.protein_uniprot_id || '—'

  const interactionsInNetwork = networkInteractions.filter(
    (ix) => ix.interactor_A.protein_id === protein.protein_id || ix.interactor_B.protein_id === protein.protein_id
  ).length

  const ncbiId = protein.protein_entrez_id
  const ensemblId = protein.protein_ensembl_id
  const uniprotId = protein.protein_uniprot_id

  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, zIndex: 20,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px 18px', width: 272,
      boxShadow: '0 6px 24px rgba(0,0,0,.14)',
      maxHeight: 'calc(100% - 24px)', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{gene}</div>
          {protein.protein_protein_name && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {protein.protein_protein_name}
            </div>
          )}
        </div>
        <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: '0 0 0 8px' }}>×</button>
      </div>

      {/* Actions */}
      <div style={SECTION}>Actions</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <button
          className="op-btn"
          style={{ fontSize: 12, padding: '6px 12px', textAlign: 'left' }}
          onClick={() => { onClose(); navigate(`/search/${encodeURIComponent(gene)}`) }}
        >
          Search {searchTerm || 'openPIP'} for {gene}
        </button>
        <button
          className="op-btn"
          style={{ fontSize: 12, padding: '6px 12px', textAlign: 'left', color: 'var(--warn)' }}
          onClick={() => { onRemove(protein.protein_id); onClose() }}
        >
          Remove {gene} From Network
        </button>
      </div>

      {/* Links */}
      <div style={SECTION}>Links</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
        {ncbiId && (
          <a href={`https://www.ncbi.nlm.nih.gov/gene/${ncbiId}`} target="_blank" rel="noreferrer" style={{ ...EXT_LINK, display: 'flex', alignItems: 'center', gap: 5 }}>
            <img src="https://www.ncbi.nlm.nih.gov/favicon.ico" width={14} height={14} alt="" style={{ borderRadius: 2, flexShrink: 0 }} />
            NCBI Gene
          </a>
        )}
        {uniprotId && (
          <a href={`https://www.proteinatlas.org/${uniprotId}`} target="_blank" rel="noreferrer" style={{ ...EXT_LINK, display: 'flex', alignItems: 'center', gap: 5 }}>
            <img src="https://www.proteinatlas.org/favicon.ico" width={14} height={14} alt="" style={{ borderRadius: 2, flexShrink: 0 }} />
            Human Protein Atlas
          </a>
        )}
        {ensemblId && (
          <a href={`https://www.ensembl.org/id/${ensemblId}`} target="_blank" rel="noreferrer" style={{ ...EXT_LINK, display: 'flex', alignItems: 'center', gap: 5 }}>
            <img src="https://www.ensembl.org/favicon.ico" width={14} height={14} alt="" style={{ borderRadius: 2, flexShrink: 0 }} />
            Ensembl
          </a>
        )}
        {gene !== '—' && (
          <a href={`https://www.genecards.org/cgi-bin/carddisp.pl?gene=${gene}`} target="_blank" rel="noreferrer" style={{ ...EXT_LINK, display: 'flex', alignItems: 'center', gap: 5 }}>
            <img src="https://www.genecards.org/favicon.ico" width={14} height={14} alt="" style={{ borderRadius: 2, flexShrink: 0 }} />
            GeneCards
          </a>
        )}
        {uniprotId && (
          <a href={`https://www.uniprot.org/uniprot/${uniprotId}`} target="_blank" rel="noreferrer" style={{ ...EXT_LINK, display: 'flex', alignItems: 'center', gap: 5 }}>
            <img src="https://www.uniprot.org/favicon.ico" width={14} height={14} alt="" style={{ borderRadius: 2, flexShrink: 0 }} />
            UniProt
          </a>
        )}
      </div>

      {/* Interaction counts */}
      <div style={SECTION}>Number of Interactions</div>
      <div style={{ fontSize: 13, color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div>Interactions in Network: <strong>{interactionsInNetwork}</strong></div>
        <div>Interactions in Database: <strong>{protein.number_of_interactions_in_database}</strong></div>
      </div>

      {/* Description */}
      {protein.protein_description && (
        <>
          <div style={SECTION}>Description</div>
          <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
            {protein.protein_description}
          </p>
        </>
      )}
    </div>
  )
}

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
    tissueExpressionActive,
    tissueSpecificityActive,
  } = useSearchStore()

  useEffect(() => {
    if (data) setSearchData(data)
  }, [data, setSearchData])

const { proteins: filteredProteins, interactions } = filterProteinsAndInteractions(
    allProteins,
    allInteractions,
    { scoreFilter, categoryFilter, annotationFilter, filterMode, tissueExpressionActive, tissueSpecificityActive },
    queryProteinIds
  )
  const proteins = removedProteinIds.length
    ? filteredProteins.filter((p) => !removedProteinIds.includes(p.protein_id))
    : filteredProteins

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
      <SearchSidebar key={term} term={term} />

      {/* Main — scrolls vertically */}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {renderMain()}
      </main>
    </div>
  )
}
