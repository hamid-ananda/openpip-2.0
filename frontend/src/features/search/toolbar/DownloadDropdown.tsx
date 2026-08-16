import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useSearchStore } from '../searchStore'
import {
  formatSIF,
  formatInteractionsCSV,
  formatInteractorsCSV,
  formatFASTA,
  formatPSIMI,
  buildFilename,
  downloadFile,
} from '../../../lib/download'

export function DownloadDropdown() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const allProteins = useSearchStore((s) => s.allProteins)
  const allInteractions = useSearchStore((s) => s.allInteractions)
  const queryProteinIds = useSearchStore((s) => s.queryProteinIds)
  const setModal = useSearchStore((s) => s.setModal)

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

  function handleDownload(content: string, format: string, ext: string) {
    downloadFile(buildFilename(format, ext), content)
    setOpen(false)
  }

  const actions: { label: string; onClick: () => void }[] = [
    {
      label: 'SIF',
      onClick: () => handleDownload(formatSIF(allInteractions, allProteins), 'SIF', 'sif'),
    },
    {
      label: 'Interactions CSV',
      onClick: () =>
        handleDownload(
          formatInteractionsCSV(allInteractions, allProteins, new Set(queryProteinIds)),
          'Interactions',
          'csv'
        ),
    },
    {
      label: 'Interactors CSV',
      onClick: () => handleDownload(formatInteractorsCSV(allProteins), 'Interactors', 'csv'),
    },
    {
      label: 'FASTA',
      onClick: () => handleDownload(formatFASTA(allProteins), 'FASTA', 'fasta'),
    },
    {
      label: 'PSI-MI',
      onClick: () => handleDownload(formatPSIMI(allInteractions, allProteins), 'PSIMI', 'tsv'),
    },
    {
      label: 'Direct Download (GZ)',
      onClick: () => {
        setModal('directDownload')
        setOpen(false)
      },
    },
    {
      label: 'Open in Cytoscape',
      onClick: () => {
        setModal('cyRest')
        setOpen(false)
      },
    },
  ]

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="op-btn"
        style={{ fontSize: 13 }}
      >
        Download
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
          padding: '8px 0',
          width: 208,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '.07em', padding: '4px 12px 8px' }}>
            Download
          </div>
          {actions.map(({ label, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              style={{ display: 'block', width: '100%', textAlign: 'left', fontSize: 13, padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
