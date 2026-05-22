import { useState } from 'react'
import { useSearchStore } from '../searchStore'
import { filterProteinsAndInteractions } from '../filterInteractions'
import { InteractionsTable } from './InteractionsTable'
import { InteractorsTable } from './InteractorsTable'

type Tab = 'interactions' | 'interactors'

const TAB_BTN = (isActive: boolean): React.CSSProperties => ({
  padding: '10px 20px',
  fontSize: 13,
  backgroundColor: isActive ? 'var(--primary-soft)' : 'transparent',
  border: 'none',
  borderBottom: isActive ? '2px solid var(--primary-deep)' : '2px solid transparent',
  marginBottom: -1,
  color: isActive ? 'var(--primary-deep)' : 'var(--text)',
  cursor: 'pointer',
  fontWeight: isActive ? 600 : 400,
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  transition: 'color .15s',
  outline: 'none',
  flexShrink: 0,
})

export function ResultTablePanel() {
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

  const { proteins, interactions } = filterProteinsAndInteractions(
    allProteins,
    allInteractions,
    { scoreFilter, categoryFilter, annotationFilter, filterMode, tissueFilter },
    queryProteinIds
  )

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'interactions', label: 'Interactions', count: interactions.length },
    { id: 'interactors', label: 'Interactors', count: proteins.length },
  ]

  return (
    <div>
      {/* Tab bar — sits on its own surface so it reads clearly against the page */}
      <div style={{
        display: 'flex',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        paddingLeft: 8,
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={TAB_BTN(isActive)}
            >
              {tab.label}
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                backgroundColor: isActive ? 'var(--primary-soft)' : 'var(--surface-2)',
                color: isActive ? 'var(--primary-deep)' : 'var(--text-muted)',
                borderRadius: 10,
                padding: '1px 7px',
              }}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table content */}
      <div style={{ background: 'var(--bg)', padding: '0' }}>
        {activeTab === 'interactions' ? (
          <InteractionsTable interactions={interactions} proteins={proteins} />
        ) : (
          <InteractorsTable proteins={proteins} queryProteinIds={queryProteinIds} />
        )}
      </div>
    </div>
  )
}
