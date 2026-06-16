import { useState } from 'react'
import { useSearchStore } from '../searchStore'
import { filterProteinsAndInteractions } from '../filterInteractions'
import { InteractionsTable } from './InteractionsTable'
import { InteractorsTable } from './InteractorsTable'
import { ProteinSummaryPanel } from './ProteinSummaryPanel'
import { EnrichmentTable } from '../enrichment/EnrichmentTable'
import { SubcellularLocationTable } from '../enrichment/SubcellularLocationTable'
import { TissueExpressionTable } from '../enrichment/TissueExpressionTable'
import type { EnrichmentSource } from '../../../api/enrichment'
import type { Protein } from '../../../types/api'

type Tab = 'interactions' | 'interactors' | EnrichmentSource | 'subcellular' | 'tissue' | 'summary'

const TABS: { id: Tab; label: string }[] = [
  { id: 'interactions', label: 'Interactions' },
  { id: 'interactors', label: 'Interactors' },
  { id: 'GO:MF', label: 'Molecular Function' },
  { id: 'GO:BP', label: 'Biological Process' },
  { id: 'GO:CC', label: 'Cellular Component' },
  { id: 'REAC', label: 'Reactome' },
  { id: 'CORUM', label: 'CORUM' },
  { id: 'KEGG', label: 'KEGG' },
  { id: 'subcellular', label: 'Subcellular Location' },
  { id: 'tissue', label: 'Tissue Expression' },
  { id: 'summary', label: 'Protein Info' },
]

const TAB_BTN = (isActive: boolean): React.CSSProperties => ({
  padding: '10px 16px',
  fontSize: 12,
  backgroundColor: isActive ? 'var(--primary-soft)' : 'transparent',
  border: 'none',
  borderBottom: isActive ? '2px solid var(--primary-deep)' : '2px solid transparent',
  marginBottom: -1,
  color: isActive ? 'var(--primary-deep)' : 'var(--text)',
  cursor: 'pointer',
  fontWeight: isActive ? 600 : 400,
  whiteSpace: 'nowrap',
  outline: 'none',
  flexShrink: 0,
  transition: 'color .15s',
  display: 'flex',
  alignItems: 'center',
  gap: 7,
})

interface Props {
  selectedProtein?: Protein | null
}

export function ResultTablePanel({ selectedProtein }: Props) {
  const {
    allProteins,
    allInteractions,
    queryProteinIds,
    scoreFilter,
    categoryFilter,
    annotationFilter,
    filterMode,
    tissueFilter,
  } = useSearchStore()

  const [activeTab, setActiveTab] = useState<Tab>('interactions')
  const [prevProtein, setPrevProtein] = useState(selectedProtein)

  // Auto-switch to summary tab when the selected protein changes (React render-phase pattern)
  if (selectedProtein !== prevProtein) {
    setPrevProtein(selectedProtein)
    if (selectedProtein) setActiveTab('summary')
  }

  const { proteins, interactions } = filterProteinsAndInteractions(
    allProteins,
    allInteractions,
    { scoreFilter, categoryFilter, annotationFilter, filterMode, tissueFilter },
    queryProteinIds
  )

  const geneNames = proteins.map((p) => p.protein_gene_name)

  const counts: Partial<Record<Tab, number>> = {
    interactions: interactions.length,
    interactors: proteins.length,
  }

  // Summary tab: show selectedProtein if set, else fall back to first query protein
  const queryProtein = allProteins.find((p) => queryProteinIds.includes(p.protein_id)) ?? null
  const summaryProtein = selectedProtein ?? queryProtein

  const summaryGene = summaryProtein?.protein_gene_name || summaryProtein?.protein_uniprot_id

  return (
    <div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        paddingLeft: 8,
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const count = counts[tab.id]
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={TAB_BTN(isActive)}
            >
              {tab.label}
              {count !== undefined && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  backgroundColor: isActive ? 'var(--primary-soft)' : 'var(--surface-2)',
                  color: isActive ? 'var(--primary-deep)' : 'var(--text-muted)',
                  borderRadius: 10, padding: '1px 7px',
                }}>
                  {count}
                </span>
              )}
              {tab.id === 'summary' && summaryGene && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  backgroundColor: isActive ? 'var(--primary-soft)' : 'var(--surface-2)',
                  color: isActive ? 'var(--primary-deep)' : 'var(--text-muted)',
                  borderRadius: 10, padding: '1px 7px',
                  fontFamily: 'var(--mono)',
                }}>
                  {summaryGene}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div style={{ background: 'var(--bg)' }}>
        {activeTab === 'interactions' ? (
          <InteractionsTable interactions={interactions} proteins={proteins} />
        ) : activeTab === 'interactors' ? (
          <InteractorsTable proteins={proteins} queryProteinIds={queryProteinIds} />
        ) : activeTab === 'subcellular' ? (
          <SubcellularLocationTable proteins={allProteins} />
        ) : activeTab === 'tissue' ? (
          <TissueExpressionTable proteins={allProteins} />
        ) : activeTab === 'summary' ? (
          summaryProtein ? (
            <ProteinSummaryPanel
              protein={summaryProtein}
              interactions={interactions}
              isQueryProtein={queryProteinIds.includes(summaryProtein.protein_id)}
            />
          ) : (
            <div style={{ padding: 32, fontSize: 13, color: 'var(--text-muted)' }}>
              Search for a protein to see its details here.
            </div>
          )
        ) : (
          <EnrichmentTable geneNames={geneNames} source={activeTab as EnrichmentSource} />
        )}
      </div>
    </div>
  )
}
