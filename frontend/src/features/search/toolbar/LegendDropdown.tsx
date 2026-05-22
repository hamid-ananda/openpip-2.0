import { useState, useRef, useEffect, type KeyboardEvent } from 'react'

const EDGE_LEGEND: { color: string; label: string }[] = [
  { color: 'var(--hi-union)',   label: 'Published' },
  { color: 'var(--huri-lit)',   label: 'Validated' },
  { color: 'var(--danger)',     label: 'Verified' },
  { color: 'var(--literature)', label: 'Literature' },
  { color: 'var(--accent)',     label: 'Mixed' },
]

export function LegendDropdown() {
  const [open, setOpen] = useState(false)
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

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-soft)',
    textTransform: 'uppercase',
    letterSpacing: '.07em',
    marginBottom: 8,
  }

  const legendRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: 'var(--text)',
    marginBottom: 5,
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }} onKeyDown={handleKeyDown}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="op-btn" style={{ fontSize: 13 }}>
        Legend
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
          width: 208,
        }}>
          <div style={sectionLabel}>Edge colors</div>
          {EDGE_LEGEND.map(({ color, label }) => (
            <div key={label} style={legendRow}>
              <span style={{ background: color, width: 24, height: 3, borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
              {label}
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--border)', margin: '10px 0' }} />

          <div style={sectionLabel}>Node colors</div>
          <div style={legendRow}>
            <span style={{ background: 'var(--color-query-node)', width: 10, height: 10, display: 'inline-block', borderRadius: '50%', flexShrink: 0 }} />
            Query protein
          </div>
          <div style={legendRow}>
            <span style={{ background: 'var(--color-interactor-node)', width: 10, height: 10, display: 'inline-block', borderRadius: '50%', flexShrink: 0 }} />
            Interactor protein
          </div>
        </div>
      )}
    </div>
  )
}
