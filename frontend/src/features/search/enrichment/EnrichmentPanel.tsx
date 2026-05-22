import { useState } from 'react'
import { EnrichmentTable } from './EnrichmentTable'
import { SubcellularLocationTable } from './SubcellularLocationTable'
import { TissueExpressionTable } from './TissueExpressionTable'
import { useSearchStore } from '../searchStore'
import type { EnrichmentSource } from '../../../api/enrichment'

interface EnrichmentPanelProps {
  geneNames: string[]
}

type Tab = EnrichmentSource | 'subcellular' | 'tissue'

const TABS: { id: Tab; label: string }[] = [
  { id: 'GO:MF', label: 'Molecular Function' },
  { id: 'GO:BP', label: 'Biological Process' },
  { id: 'GO:CC', label: 'Cellular Component' },
  { id: 'REAC', label: 'Reactome' },
  { id: 'CORUM', label: 'CORUM' },
  { id: 'KEGG', label: 'KEGG' },
  { id: 'subcellular', label: 'Subcellular Location' },
  { id: 'tissue', label: 'Tissue Expression' },
]

const TAB_BTN = (isActive: boolean): React.CSSProperties => ({
  padding: '10px 16px',
  fontSize: 12,
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
  marginBottom: -1,
  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
  cursor: 'pointer',
  fontWeight: isActive ? 600 : 400,
  whiteSpace: 'nowrap',
  outline: 'none',
  flexShrink: 0,
  transition: 'color .15s',
})

export function EnrichmentPanel({ geneNames }: EnrichmentPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('GO:MF')
  const allProteins = useSearchStore((s) => s.allProteins)

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        paddingLeft: 8,
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={TAB_BTN(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background: 'var(--bg)', padding: '16px 0' }}>
        {activeTab === 'subcellular' ? (
          <SubcellularLocationTable proteins={allProteins} />
        ) : activeTab === 'tissue' ? (
          <TissueExpressionTable proteins={allProteins} />
        ) : (
          <EnrichmentTable geneNames={geneNames} source={activeTab} />
        )}
      </div>
    </div>
  )
}
