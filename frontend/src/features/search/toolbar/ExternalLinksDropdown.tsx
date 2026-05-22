import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { buildLinks } from '../externalLinks'
import { useSearchStore } from '../searchStore'

export function ExternalLinksDropdown() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const allProteins = useSearchStore((s) => s.allProteins)
  const queryProteinIds = useSearchStore((s) => s.queryProteinIds)

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

  const links = buildLinks(allProteins, queryProteinIds)

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="op-btn"
        style={{ fontSize: 13 }}
      >
        External Links
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
          padding: '4px 0',
          width: 176,
        }}>
          {allProteins.length === 0 ? (
            <div style={{ padding: '8px 16px', fontSize: 13, color: 'var(--text-muted)' }}>No proteins loaded.</div>
          ) : (
            links.map((link) => {
              const itemStyle = { display: 'block', width: '100%', textAlign: 'left' as const, fontSize: 12, padding: '6px 16px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none' }
              return link.href ? (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={itemStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <button
                  key={link.id}
                  type="button"
                  style={itemStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  onClick={() => {
                    link.onClick?.()
                    setOpen(false)
                  }}
                >
                  {link.label}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
