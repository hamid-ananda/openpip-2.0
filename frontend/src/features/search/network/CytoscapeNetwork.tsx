import { useRef, useState, useMemo, useEffect } from 'react'
import CytoscapeComponent from 'react-cytoscapejs'
import cytoscape from 'cytoscape'
import type { LayoutOptions } from 'cytoscape'
import cola from 'cytoscape-cola'
import type { Protein, Interaction } from '../../../types/api'
import { buildElements } from './cytoscapeElements'
import { NETWORK_STYLESHEET } from './cytoscapeStyles'

// Register cytoscape-cola extension once at module level.
// Wrapped in try/catch to silently ignore double-registration errors
// (can happen during hot reload).
try {
  cytoscape.use(cola)
} catch {
  // already registered — safe to ignore
}

export type LayoutName = 'cola' | 'cose' | 'concentric' | 'circle' | 'grid'

interface CytoscapeNetworkProps {
  proteins: Protein[]
  interactions: Interaction[]
  queryProteinIds: number[]
  layout: LayoutName
  onNodeClick?: (protein: Protein) => void
  onEdgeClick?: (interaction: Interaction) => void
}

interface TooltipState {
  x: number
  y: number
  label: string
}

export function CytoscapeNetwork({
  proteins,
  interactions,
  queryProteinIds,
  layout,
  onNodeClick,
  onEdgeClick,
}: CytoscapeNetworkProps) {
  // cy instance stored in a ref — not state — to avoid triggering re-renders.
  // Using `any` here because cytoscape-cola augments the cytoscape types in ways
  // that make strict typing impractical; see frontend/CLAUDE.md.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cyRef = useRef<any>(null)

  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const elements = useMemo(
    () => buildElements(proteins, interactions, queryProteinIds),
    [proteins, interactions, queryProteinIds]
  )

  // Re-run layout when the layout name changes (without remounting the whole graph).
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.layout({ name: layout } as LayoutOptions).run()
  }, [layout])

  // Bind tap and hover event handlers. Re-bind whenever proteins/interactions
  // or the click callbacks change so the closures stay fresh.
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    const onNodeTap = (e: cytoscape.EventObject) => {
      const id = e.target.data('id') as string // e.g. "p1"
      const proteinId = parseInt(id.slice(1), 10)
      const protein = proteins.find((p) => p.protein_id === proteinId)
      if (protein) onNodeClick?.(protein)
    }

    const onEdgeTap = (e: cytoscape.EventObject) => {
      const id = e.target.data('id') as string // e.g. "i1"
      const intId = parseInt(id.slice(1), 10)
      const interaction = interactions.find((i) => i.interaction_id === intId)
      if (interaction) onEdgeClick?.(interaction)
    }

    const onNodeMouseover = (e: cytoscape.EventObject) => {
      const label = e.target.data('label') as string
      const { clientX, clientY } = e.originalEvent as MouseEvent
      setTooltip({ x: clientX, y: clientY, label })
    }

    const onNodeMouseout = () => {
      setTooltip(null)
    }

    cy.on('tap', 'node', onNodeTap)
    cy.on('tap', 'edge', onEdgeTap)
    cy.on('mouseover', 'node', onNodeMouseover)
    cy.on('mouseout', 'node', onNodeMouseout)

    return () => {
      cy.removeAllListeners()
    }
  }, [proteins, interactions, onNodeClick, onEdgeClick])

  return (
    <div style={{ position: 'relative' }}>
      {/* key={layout} forces a full remount when layout changes to avoid
          stale internal Cytoscape layout state */}
      <CytoscapeComponent
        key={layout}
        elements={elements}
        stylesheet={NETWORK_STYLESHEET}
        layout={{ name: layout } as Parameters<typeof CytoscapeComponent>[0]['layout']}
        style={{ width: '100%', height: 500 }}
        cy={(cy) => {
          cyRef.current = cy
        }}
      />
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 10,
            top: tooltip.y - 30,
            background: '#333',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: 3,
            fontSize: 12,
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  )
}
