import { Modal } from './Modal'

export function DirectDownloadModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Direct Download" onClose={onClose}>
      <p className="text-gray-600 mb-4">
        Download the complete dataset as a compressed archive.
      </p>
      <div className="flex gap-3 justify-end">
        <a
          href="/api/datasets/download/"
          className="px-4 py-2 rounded text-sm text-white"
          style={{ background: 'var(--color-button)' }}
          onClick={onClose}
        >
          Download Archive
        </a>
        <button onClick={onClose} className="px-4 py-2 border rounded text-sm">
          Close
        </button>
      </div>
    </Modal>
  )
}
