import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { CONTROL_BG, CONTROL_HEIGHT } from './LayoutDropdown'

/**
 * Shell for the controls floating over the network canvas: a button that
 * opens a panel upward, since the row sits at the bottom edge. Closes on a
 * click outside or Escape, so it behaves like the layout menu beside it.
 *
 * `up={false}` flips it for the ribbon under the navbar, where the button is
 * at the top edge and the panel has the whole page to drop into, and `plain`
 * drops the button chrome there for a themed heading over a chevron — a row of
 * bordered grey buttons reads as a toolbar, which the ribbon is not.
 */
export function CanvasDropdown({ label, width = 232, up = true, plain = false, children }: {
  label: string
  width?: number
  up?: boolean
  plain?: boolean
  children: React.ReactNode
}) {
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

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }} onKeyDown={handleKeyDown}>
      {plain ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            background: 'none',
            border: 'none',
            padding: '3px 10px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--primary)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            whiteSpace: 'nowrap',
          }}>
            {label}
          </span>
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"
            style={{ opacity: 0.7, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="op-btn"
          aria-expanded={open}
          style={{
            height: CONTROL_HEIGHT,
            fontSize: 12,
            padding: '0 10px',
            background: CONTROL_BG,
          }}
        >
          {label}
        </button>
      )}

      {open && (
        <div style={{
          position: 'absolute',
          ...(up
            ? { right: 0, bottom: '100%', marginBottom: 4 }
            : { top: '100%', marginTop: 4, ...(plain ? { left: '50%', transform: 'translateX(-50%)' } : { left: 0 }) }),
          zIndex: 50,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          boxShadow: 'var(--shadow-md)',
          padding: 14,
          width,
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

