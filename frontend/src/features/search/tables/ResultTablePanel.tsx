import { useState } from 'react'
import { useSearchStore } from '../searchStore'
import { filterProteinsAndInteractions } from '../filterInteractions'
import { InteractionsTable } from './InteractionsTable'
import { InteractorsTable } from './InteractorsTable'

type Tab = 'interactions' | 'interactors'

export function ResultTablePanel() {
  const {
    allProteins,
    allInteractions,
    queryProteinIds,
    scoreFilter,
    categoryFilter,
    annotationFilter,
    filterMode,
    tissueExpressionActive,
    tissueSpecificityActive,
  } = useSearchStore()

  const [activeTab, setActiveTab] = useState<Tab>('interactions')

  const { proteins, interactions } = filterProteinsAndInteractions(
    allProteins,
    allInteractions,
    { scoreFilter, categoryFilter, annotationFilter, filterMode, tissueExpressionActive, tissueSpecificityActive },
    queryProteinIds
  )

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'interactions', label: 'Interactions', count: interactions.length },
    { id: 'interactors', label: 'Interactors', count: proteins.length },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
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
            <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'interactions' ? (
          <InteractionsTable interactions={interactions} proteins={proteins} />
        ) : (
          <InteractorsTable proteins={proteins} queryProteinIds={queryProteinIds} />
        )}
      </div>
    </div>
  )
}
