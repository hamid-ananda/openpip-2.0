import { useState } from 'react'
import { GOEnrichmentTable } from './GOEnrichmentTable'
import { PathwayEnrichmentTable } from './PathwayEnrichmentTable'
import { ComplexEnrichmentTable } from './ComplexEnrichmentTable'

interface EnrichmentPanelProps {
  geneNames: string[]
}

type Tab = 'go' | 'pathways' | 'complexes'

const TABS: { id: Tab; label: string }[] = [
  { id: 'go', label: 'Gene Ontology' },
  { id: 'pathways', label: 'Pathways' },
  { id: 'complexes', label: 'Protein Complexes' },
]

export function EnrichmentPanel({ geneNames }: EnrichmentPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('go')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm ${
              activeTab === tab.id
                ? 'border-b-2 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={
              activeTab === tab.id
                ? { borderColor: 'var(--color-main)', color: 'var(--color-main)' }
                : undefined
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — only mount active tab (lazy) */}
      <div className="mt-4">
        {activeTab === 'go' && <GOEnrichmentTable geneNames={geneNames} />}
        {activeTab === 'pathways' && <PathwayEnrichmentTable geneNames={geneNames} />}
        {activeTab === 'complexes' && <ComplexEnrichmentTable geneNames={geneNames} />}
      </div>
    </div>
  )
}
