import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { useSearchStore } from '../searchStore'

const FILTER_MODE_OPTIONS: { label: string; value: 'None' | 'query_query' | 'query_interactor' }[] = [
  { label: 'None', value: 'None' },
  { label: 'Query-Query', value: 'query_query' },
  { label: 'Query-Interactor', value: 'query_interactor' },
]

const PANEL: React.CSSProperties = {
  position: 'absolute',
  zIndex: 50,
  marginTop: 4,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  boxShadow: 'var(--shadow-md)',
  padding: 14,
  width: 272,
}

const SECTION: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-soft)',
  textTransform: 'uppercase',
  letterSpacing: '.07em',
  marginBottom: 8,
}

const LABEL: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  color: 'var(--text)',
  cursor: 'pointer',
  marginBottom: 5,
}

const DIVIDER: React.CSSProperties = {
  borderTop: '1px solid var(--border)',
  margin: '10px 0',
}

export function FilterDropdown() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const categoryFilter = useSearchStore((s) => s.categoryFilter)
  const scoreFilter = useSearchStore((s) => s.scoreFilter)
  const filterMode = useSearchStore((s) => s.filterMode)
  const setCategoryFilter = useSearchStore((s) => s.setCategoryFilter)
  const setScoreFilter = useSearchStore((s) => s.setScoreFilter)
  const setFilterMode = useSearchStore((s) => s.setFilterMode)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }} onKeyDown={handleKeyDown}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="op-btn" style={{ fontSize: 13 }}>
        Filter
      </button>

      {open && (
        <div style={PANEL}>
          {/* Category checkboxes */}
          <div style={SECTION}>Interaction sources</div>
          <div style={{ marginBottom: 10 }}>
            {Object.entries(categoryFilter).map(([name, checked]) => (
              <label key={name} style={LABEL}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setCategoryFilter(name, e.target.checked)}
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                {name}
              </label>
            ))}
          </div>

          <div style={DIVIDER} />

          {/* Score filter */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ ...SECTION, marginBottom: 10 }}>Min score: {scoreFilter.toFixed(2)}</div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={scoreFilter}
              onChange={(v) => setScoreFilter(v as number)}
            />
          </div>

          <div style={DIVIDER} />

          {/* Filter mode */}
          <div>
            <div style={SECTION}>Filter mode</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {FILTER_MODE_OPTIONS.map(({ label, value }) => (
                <label key={value} style={{ ...LABEL, marginBottom: 0 }}>
                  <input
                    type="radio"
                    name="filterMode"
                    value={value}
                    checked={filterMode === value}
                    onChange={() => setFilterMode(value)}
                    style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
