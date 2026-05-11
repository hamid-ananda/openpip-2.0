import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'

interface SearchDropdownProps {
  currentTerm: string
}

export function SearchDropdown({ currentTerm }: SearchDropdownProps) {
  const [open, setOpen] = useState(false)
  // term is initialized from the prop; callers should remount via key when currentTerm changes
  const [term, setTerm] = useState(currentTerm)
  const navigate = useNavigate()
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

  // Close on Escape
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') setOpen(false)
  }

  function handleSubmit() {
    const trimmed = term.trim()
    if (trimmed) {
      navigate('/search/' + encodeURIComponent(trimmed))
      setOpen(false)
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative inline-block" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-50"
      >
        Search
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded shadow-lg p-3 w-72">
          <input
            autoFocus
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search proteins…"
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2"
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="px-3 py-1 rounded text-sm"
            style={{ background: 'var(--color-button)', color: '#fff' }}
          >
            Search
          </button>
        </div>
      )}
    </div>
  )
}
