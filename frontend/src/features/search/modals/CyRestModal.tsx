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
      <p className="text-gray-600 mb-2">
        The network can be imported into Cytoscape Desktop via its REST API (CyREST).
      </p>
      <p className="text-gray-600 mb-4">
        Make sure Cytoscape is running on your computer, then click &quot;Import&quot;.
      </p>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="px-4 py-2 border rounded text-sm">
          Cancel
        </button>
        <button
          onClick={handleImport}
          disabled={loading}
          className="px-4 py-2 rounded text-sm text-white disabled:opacity-50"
          style={{ background: 'var(--color-button)' }}
        >
          {loading ? 'Importing...' : 'Import'}
        </button>
      </div>
    </Modal>
  )
}
