import { useState } from 'react'
import { Modal } from './Modal'
import { useAuthStore } from '../../../store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export function DirectDownloadModal({ onClose }: { onClose: () => void }) {
  const token = useAuthStore((s) => s.token)
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/datasets/download/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'datasets.zip'
      a.click()
      URL.revokeObjectURL(url)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Direct Download" onClose={onClose}>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
        Download the complete interaction database as a compressed archive.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} className="op-btn" style={{ padding: '8px 16px' }}>
          Cancel
        </button>
        <button
          onClick={handleDownload}
          disabled={loading}
          className="op-btn primary"
          style={{ padding: '8px 16px' }}
        >
          {loading ? 'Downloading…' : 'Download Archive'}
        </button>
      </div>
    </Modal>
  )
}
