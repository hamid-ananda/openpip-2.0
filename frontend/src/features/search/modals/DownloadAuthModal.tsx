import { useNavigate } from 'react-router-dom'
import { Modal } from './Modal'

export function DownloadAuthModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <Modal title="Login Required" onClose={onClose}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        You must be logged in to download interaction data.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={onClose} className="op-btn" style={{ fontSize: 13 }}>
          Cancel
        </button>
        <button
          onClick={() => { onClose(); navigate('/login') }}
          className="op-btn primary"
          style={{ fontSize: 13 }}
        >
          Log In
        </button>
      </div>
    </Modal>
  )
}
