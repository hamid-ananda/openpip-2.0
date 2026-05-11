import { useState, useRef, useEffect, type KeyboardEvent } from 'react'

const EDGE_LEGEND: { color: string; label: string }[] = [
  { color: '#0000ff', label: 'Published' },
  { color: '#00aa00', label: 'Validated' },
  { color: '#aa00aa', label: 'Verified' },
  { color: '#ff0000', label: 'Literature' },
  { color: '#ff55dd', label: 'Mixed' },
]

export function LegendDropdown() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
        Legend
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded shadow-lg p-3 w-52">
          <div className="text-sm font-medium mb-2">Edge Colors</div>
          {EDGE_LEGEND.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm mb-1">
              <span
                style={{
                  background: color,
                  width: 12,
                  height: 12,
                  display: 'inline-block',
                  borderRadius: '50%',
                  flexShrink: 0,
                }}
              />
              {label}
            </div>
          ))}

          <hr className="border-gray-200 my-2" />

          <div className="text-sm font-medium mb-2">Node Colors</div>
          <div className="flex items-center gap-2 text-sm mb-1">
            <span
              style={{
                background: 'var(--color-query-node)',
                width: 12,
                height: 12,
                display: 'inline-block',
                borderRadius: '50%',
                flexShrink: 0,
              }}
            />
            Query protein
          </div>
          <div className="flex items-center gap-2 text-sm mb-1">
            <span
              style={{
                background: 'var(--color-interactor-node)',
                width: 12,
                height: 12,
                display: 'inline-block',
                borderRadius: '50%',
                flexShrink: 0,
              }}
            />
            Interactor protein
          </div>
        </div>
      )}
    </div>
  )
}
