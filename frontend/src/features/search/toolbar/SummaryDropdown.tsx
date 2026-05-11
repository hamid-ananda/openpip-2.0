import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useSearchStore } from '../searchStore'

export function SummaryDropdown() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const foundSummary = useSearchStore((s) => s.foundSummary)
  const unfoundSummary = useSearchStore((s) => s.unfoundSummary)
  const allProteins = useSearchStore((s) => s.allProteins)
  const allInteractions = useSearchStore((s) => s.allInteractions)

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
        Summary
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded shadow-lg p-3 w-72">
          <div className="text-sm font-medium mb-2">Summary</div>

          <div className="text-sm mb-1">
            <span className="font-medium">Found: </span>
            <span dangerouslySetInnerHTML={{ __html: foundSummary }} />
          </div>

          <div className="text-sm mb-1">
            <span className="font-medium">Not found: </span>
            {unfoundSummary || '—'}
          </div>

          <div className="text-sm mb-1">
            <span className="font-medium">Total proteins: </span>
            {allProteins.length}
          </div>

          <div className="text-sm">
            <span className="font-medium">Total interactions: </span>
            {allInteractions.length}
          </div>
        </div>
      )}
    </div>
  )
}
