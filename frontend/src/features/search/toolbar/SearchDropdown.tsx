import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'

interface SearchDropdownProps {
  currentTerm: string
}

export function SearchDropdown({ currentTerm }: SearchDropdownProps) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState(currentTerm)
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

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
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }} onKeyDown={handleKeyDown}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="op-btn" style={{ fontSize: 13 }}>
        Search
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          zIndex: 50,
          marginTop: 4,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          boxShadow: 'var(--shadow-md)',
          padding: 14,
          width: 272,
        }}>
          <input
            autoFocus
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Gene symbol or UniProt ID"
            className="op-input"
            style={{ fontSize: 13, marginBottom: 8, fontFamily: 'var(--mono)' }}
          />
          <button type="button" onClick={handleSubmit} className="op-btn primary" style={{ fontSize: 13 }}>
            Search
          </button>
        </div>
      )}
    </div>
  )
}
