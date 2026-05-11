import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useSearchStore } from '../searchStore'
import { useAuthStore } from '../../../store/authStore'
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
  const setModal = useSearchStore((s) => s.setModal)

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

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

  function handleAuthRequired() {
    setModal('downloadAuth')
    setOpen(false)
  }

  function handleDownload(content: string, format: string, ext: string) {
    downloadFile(buildFilename(format, ext), content)
    setOpen(false)
  }

  const lockIcon = !isLoggedIn ? ' 🔒' : ''

  const actions: { label: string; onClick: () => void }[] = isLoggedIn
    ? [
        {
          label: 'SIF',
          onClick: () => handleDownload(formatSIF(allInteractions, allProteins), 'SIF', 'sif'),
        },
        {
          label: 'Interactions CSV',
          onClick: () =>
            handleDownload(
              formatInteractionsCSV(allInteractions, allProteins),
              'Interactions',
              'csv'
            ),
        },
        {
          label: 'Interactors CSV',
          onClick: () =>
            handleDownload(formatInteractorsCSV(allProteins), 'Interactors', 'csv'),
        },
        {
          label: 'FASTA',
          onClick: () => handleDownload(formatFASTA(allProteins), 'FASTA', 'fasta'),
        },
        {
          label: 'PSI-MI',
          onClick: () =>
            handleDownload(formatPSIMI(allInteractions, allProteins), 'PSIMI', 'tsv'),
        },
        {
          label: 'Direct Download (GZ)',
          onClick: () => {
            setModal('directDownload')
            setOpen(false)
          },
        },
      ]
    : [
        { label: `SIF${lockIcon}`, onClick: handleAuthRequired },
        { label: `Interactions CSV${lockIcon}`, onClick: handleAuthRequired },
        { label: `Interactors CSV${lockIcon}`, onClick: handleAuthRequired },
        { label: `FASTA${lockIcon}`, onClick: handleAuthRequired },
        { label: `PSI-MI${lockIcon}`, onClick: handleAuthRequired },
        { label: `Direct Download (GZ)${lockIcon}`, onClick: handleAuthRequired },
      ]

  return (
    <div ref={containerRef} className="relative inline-block" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-50"
      >
        Download
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded shadow-lg p-3 w-52">
          <div className="text-sm font-medium mb-2">Download</div>
          {actions.map(({ label, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-50"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
