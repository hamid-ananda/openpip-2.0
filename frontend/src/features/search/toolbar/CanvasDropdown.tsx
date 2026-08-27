import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { CONTROL_BG, CONTROL_HEIGHT } from './LayoutDropdown'

/**
 * Shell for the controls floating over the network canvas: a button that
 * opens a panel upward, since the row sits at the bottom edge. Closes on a
 * click outside or Escape, so it behaves like the layout menu beside it.
 *
 * `up={false}` flips it for the ribbon under the navbar, where the button is
 * at the top edge and the panel has the whole page to drop into, and `plain`
 * drops the button chrome there for a bare themed heading — a row of bordered
 * grey buttons reads as a toolbar, which the ribbon is not. A plain heading
 * opens on hover; the click stays for touch and keyboard, which have none.
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

  // Hovering the heading opens it, and the panel counts as inside the heading
  // for as long as it is a DOM child — so it sits flush underneath, with no gap
  // to cross that would read as a mouse-out.
  const hover = plain
    ? { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) }
    : {}

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-block' }}
      onKeyDown={handleKeyDown}
      {...hover}
    >
      {plain ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--primary)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            whiteSpace: 'nowrap',
            background: 'none',
            border: 'none',
            // Underlines the open one, which is the only cue left now that the
            // chevron is gone.
            borderBottom: `2px solid ${open ? 'var(--primary)' : 'transparent'}`,
            padding: '4px 10px 3px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {label}
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
            : plain
              // Flush under the heading: a gap here is a mouse-out.
              ? { top: '100%', left: '50%', transform: 'translateX(-50%)' }
              : { top: '100%', marginTop: 4, left: 0 }),
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

