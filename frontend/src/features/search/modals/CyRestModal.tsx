import { useState } from 'react'
import axios from 'axios'
import { Modal } from './Modal'
import { useSearchStore } from '../searchStore'
import { formatSIF } from '../../../lib/download'

export function CyRestModal({ onClose }: { onClose: () => void }) {
  const { allProteins, allInteractions } = useSearchStore()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    setError(null)
    setLoading(true)
    const content = formatSIF(allInteractions, allProteins)
    try {
      await axios.post('http://localhost:1234/v1/networks', content, {
        headers: { 'Content-Type': 'text/plain' },
      })
      onClose()
    } catch {
      setError('Could not connect to Cytoscape. Make sure Cytoscape Desktop is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Open in Cytoscape" onClose={onClose}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
        The network can be imported into Cytoscape Desktop via its REST API (CyREST).
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        Make sure Cytoscape is running on your computer, then click &quot;Import&quot;.
      </p>
      {error && (
        <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 16 }}>{error}</p>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={onClose} className="op-btn" style={{ fontSize: 13 }}>
          Cancel
        </button>
        <button
          onClick={handleImport}
          disabled={loading}
          className="op-btn primary"
          style={{ fontSize: 13 }}
        >
          {loading ? 'Importing…' : 'Import'}
        </button>
      </div>
    </Modal>
  )
}
