import { useNavigate } from 'react-router-dom'
import { Modal } from './Modal'
import { useText } from '../../../text'

export function DownloadAuthModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const t = useText()
  return (
    <Modal title={t('search.authModal.title')} onClose={onClose}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        {t('search.authModal.body')}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={onClose} className="op-btn" style={{ fontSize: 13 }}>
          {t('search.authModal.cancel')}
        </button>
        <button
          onClick={() => { onClose(); navigate('/login') }}
          className="op-btn primary"
          style={{ fontSize: 13 }}
        >
          {t('search.authModal.confirm')}
        </button>
      </div>
    </Modal>
  )
}
