import { useState } from 'react'
import { Modal } from './Modal'
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

type Format = 'sif' | 'interactions_csv' | 'interactors_csv' | 'fasta' | 'psimi'

const FORMAT_LABELS: Record<Format, string> = {
  sif: 'SIF',
  interactions_csv: 'Interactions CSV',
  interactors_csv: 'Interactors CSV',
  fasta: 'FASTA',
  psimi: 'PSI-MI',
}

const FORMAT_EXT: Record<Format, string> = {
  sif: 'sif',
  interactions_csv: 'csv',
  interactors_csv: 'csv',
  fasta: 'fasta',
  psimi: 'txt',
}

export function DownloadModal({ onClose }: { onClose: () => void }) {
  const { allProteins, allInteractions } = useSearchStore()
  const [fmt, setFmt] = useState<Format>('sif')

  const handleDownload = () => {
    let content = ''
    if (fmt === 'sif') content = formatSIF(allInteractions, allProteins)
    else if (fmt === 'interactions_csv') content = formatInteractionsCSV(allInteractions, allProteins)
    else if (fmt === 'interactors_csv') content = formatInteractorsCSV(allProteins)
    else if (fmt === 'fasta') content = formatFASTA(allProteins)
    else if (fmt === 'psimi') content = formatPSIMI(allInteractions, allProteins)
    downloadFile(buildFilename(fmt, FORMAT_EXT[fmt]), content)
    onClose()
  }

  return (
    <Modal title="Download Data" onClose={onClose}>
      <div className="space-y-2 mb-4">
        {(Object.keys(FORMAT_LABELS) as Format[]).map((f) => (
          <label key={f} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="format" value={f} checked={fmt === f} onChange={() => setFmt(f)} />
            <span className="text-sm">{FORMAT_LABELS[f]}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 border rounded text-sm">
          Cancel
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 rounded text-sm text-white"
          style={{ background: 'var(--color-button)' }}
        >
          Download
        </button>
      </div>
    </Modal>
  )
}
