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
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }} onKeyDown={handleKeyDown}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="op-btn" style={{ fontSize: 13 }}>
        Layout
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
          width: 224,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
            Layout
          </div>
          {LAYOUT_OPTIONS.map(({ value, label }) => (
            <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer', marginBottom: 5 }}>
              <input
                type="radio"
                name="layoutOption"
                value={value}
                checked={selectedLayout === value}
                onChange={() => handleSelect(value)}
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              {label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
