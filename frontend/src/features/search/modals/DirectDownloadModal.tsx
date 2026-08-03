import { useState } from 'react'
import { Modal } from './Modal'
import { useAuthStore } from '../../../store/authStore'
import { BASE_URL } from '../../../api/client'

export function DirectDownloadModal({ onClose }: { onClose: () => void }) {
  const token = useAuthStore((s) => s.token)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/datasets/download/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        setError(`Download failed (${res.status}). Please try again.`)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'datasets.zip'
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      onClose()
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Direct Download" onClose={onClose}>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
        Download the complete interaction database as a compressed archive.
      </p>
      {error && (
        <p style={{ fontSize: 13, color: 'var(--danger, #e53e3e)', marginBottom: 16 }}>{error}</p>
      )}
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
