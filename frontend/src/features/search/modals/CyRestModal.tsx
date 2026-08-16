import { useState } from 'react'
import { Modal } from './Modal'
import { useSearchStore } from '../searchStore'
import { buildElements } from '../network/cytoscapeElements'

// CyREST listens on the loopback interface only. Use the IP rather than
// "localhost" — Firefox treats the hostname as a remote origin in some
// versions, the IP literal is always exempt from mixed-content blocking.
const CYREST_URL = 'http://127.0.0.1:1234/v1/networks'

export function CyRestModal({ onClose }: { onClose: () => void }) {
  const { allProteins, allInteractions, queryProteinIds, searchTerm } = useSearchStore()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // CyREST wants Cytoscape.js JSON split into nodes/edges, and reads a node's
  // display name from data.name.
  const buildCyjs = () => {
    const nodes = []
    const edges = []
    for (const el of buildElements(allProteins, allInteractions, queryProteinIds)) {
      if (el.data.source) {
        edges.push({ data: { ...el.data, interaction: el.data.category ?? 'pp' } })
      } else {
        nodes.push({ data: { ...el.data, name: el.data.label } })
      }
    }
    return {
      data: { name: `openPIP: ${searchTerm || 'network'}` },
      elements: { nodes, edges },
    }
  }

  const handleImport = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(CYREST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCyjs()),
      })
      if (!res.ok) {
        setError(`Cytoscape rejected the import (HTTP ${res.status}).`)
        return
      }
      onClose()
    } catch {
      setError(
        'Could not reach Cytoscape on 127.0.0.1:1234. Make sure Cytoscape Desktop is ' +
          'running on this computer and that CyREST is enabled.' +
          (window.location.protocol === 'https:'
            ? ' Some browsers also block calls from an https page to a local port.'
            : '')
      )
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
