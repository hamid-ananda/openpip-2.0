import { useNavigate } from 'react-router-dom'
import { Modal } from './Modal'

export function DownloadAuthModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <Modal title="Login Required" onClose={onClose}>
      <p className="text-gray-600 mb-4">You must be logged in to download interaction data.</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="px-4 py-2 border rounded text-sm">
          Cancel
        </button>
        <button
          onClick={() => {
            onClose()
            navigate('/login')
          }}
          className="px-4 py-2 rounded text-sm text-white"
          style={{ background: 'var(--color-button)' }}
        >
          Log In
        </button>
      </div>
    </Modal>
  )
}
