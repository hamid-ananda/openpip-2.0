import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { useSearchStore } from '../searchStore'

const FILTER_MODE_OPTIONS: { label: string; value: 'None' | 'query_query' | 'query_interactor' }[] =
  [
    { label: 'None', value: 'None' },
    { label: 'Query-Query', value: 'query_query' },
    { label: 'Query-Interactor', value: 'query_interactor' },
  ]

export function FilterDropdown() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const categoryFilter = useSearchStore((s) => s.categoryFilter)
  const scoreFilter = useSearchStore((s) => s.scoreFilter)
  const filterMode = useSearchStore((s) => s.filterMode)
  const setCategoryFilter = useSearchStore((s) => s.setCategoryFilter)
  const setScoreFilter = useSearchStore((s) => s.setScoreFilter)
  const setFilterMode = useSearchStore((s) => s.setFilterMode)

  // Close on click outside
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
    <div ref={containerRef} className="relative inline-block" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-50"
      >
        Filter
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded shadow-lg p-3 w-72">
          {/* Category checkboxes */}
          <div className="mb-3">
            {Object.entries(categoryFilter).map(([name, checked]) => (
              <label key={name} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setCategoryFilter(name, e.target.checked)}
                />
                {name}
              </label>
            ))}
          </div>

          <hr className="border-gray-200 mb-3" />

          {/* Score filter */}
          <div className="mb-3">
            <div className="text-sm mb-2">Min Score: {scoreFilter.toFixed(2)}</div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={scoreFilter}
              onChange={(v) => setScoreFilter(v as number)}
            />
          </div>

          <hr className="border-gray-200 mb-3" />

          {/* Filter mode */}
          <div>
            <div className="text-sm font-medium mb-1">Filter Mode:</div>
            <div className="flex gap-3">
              {FILTER_MODE_OPTIONS.map(({ label, value }) => (
                <label key={value} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="filterMode"
                    value={value}
                    checked={filterMode === value}
                    onChange={() => setFilterMode(value)}
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
