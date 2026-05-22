import { useState } from 'react'
import { EnrichmentTable } from './EnrichmentTable'
import type { EnrichmentSource } from '../../../api/enrichment'

interface EnrichmentPanelProps {
  geneNames: string[]
}

const TABS: { id: EnrichmentSource; label: string }[] = [
  { id: 'GO:MF', label: 'Molecular Function' },
  { id: 'GO:BP', label: 'Biological Process' },
  { id: 'GO:CC', label: 'Cellular Component' },
  { id: 'REAC', label: 'Reactome' },
  { id: 'CORUM', label: 'CORUM' },
  { id: 'KEGG', label: 'KEGG' },
]

export function EnrichmentPanel({ geneNames }: EnrichmentPanelProps) {
  const [activeTab, setActiveTab] = useState<EnrichmentSource>('GO:MF')

  return (
    <div style={{ background: 'var(--bg)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 14px',
                fontSize: 12,
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: -1,
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: isActive ? 500 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div style={{ padding: '16px 0' }}>
        <EnrichmentTable geneNames={geneNames} source={activeTab} />
      </div>
    </div>
  )
}
