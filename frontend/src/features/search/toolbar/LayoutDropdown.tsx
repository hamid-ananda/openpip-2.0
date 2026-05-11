import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useSearchStore } from '../searchStore'

type LayoutName = 'cola' | 'cose' | 'concentric' | 'circle' | 'grid'

const LAYOUT_OPTIONS: { value: LayoutName; label: string }[] = [
  { value: 'cola', label: 'Force-directed (Cola)' },
  { value: 'cose', label: 'Force-directed (CoSE)' },
  { value: 'concentric', label: 'Concentric' },
  { value: 'circle', label: 'Circle' },
  { value: 'grid', label: 'Grid' },
]

export function LayoutDropdown() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedLayout = useSearchStore((s) => s.selectedLayout)
  const setLayout = useSearchStore((s) => s.setLayout)

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

  function handleSelect(name: LayoutName) {
    setLayout(name)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative inline-block" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-50"
      >
        Layout
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded shadow-lg p-3 w-56">
          <div className="text-sm font-medium mb-2">Layout</div>
          {LAYOUT_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
              <input
                type="radio"
                name="layoutOption"
                value={value}
                checked={selectedLayout === value}
                onChange={() => handleSelect(value)}
              />
              {label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
