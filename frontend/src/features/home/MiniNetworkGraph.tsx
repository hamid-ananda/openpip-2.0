import { useMemo, useState } from 'react'
import CytoscapeComponent from 'react-cytoscapejs'
import type { ElementDefinition, StylesheetJsonBlock } from 'cytoscape'

interface MiniNetworkGraphProps {
  proteins: string[]
}

function shuffleSlice(proteins: string[], seed: number): string[] {
  // deterministic-ish shuffle keyed on seed so it changes on Refresh
  const arr = [...proteins]
  let s = seed + 1
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, 8)
}

function buildElements(proteins: string[]): ElementDefinition[] {
  const nodes: ElementDefinition[] = proteins.map((name, i) => ({
    data: { id: `n${i}`, label: name },
  }))
  const edges: ElementDefinition[] = proteins.slice(0, -1).map((_, i) => ({
    data: { id: `e${i}`, source: `n${i}`, target: `n${i + 1}` },
  }))
  return [...nodes, ...edges]
}

const STYLESHEET: StylesheetJsonBlock[] = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'background-color': 'var(--color-interactor-node)',
      color: '#ffffff',
      'text-outline-width': 1,
      'font-size': 10,
      width: 40,
      height: 40,
    },
  },
  {
    selector: 'edge',
    style: { 'line-color': '#cccccc', width: 2 },
  },
]

export function MiniNetworkGraph({ proteins }: MiniNetworkGraphProps) {
  const [seed, setSeed] = useState(0)
  const elements = useMemo(
    () => buildElements(shuffleSlice(proteins, seed)),
    [proteins, seed]
  )

  return (
    <div className="relative border rounded overflow-hidden">
      <CytoscapeComponent
        key={seed}
        elements={elements}
        stylesheet={STYLESHEET}
        layout={{ name: 'cola' } as Parameters<typeof CytoscapeComponent>[0]['layout']}
        style={{ width: '100%', height: 320 }}
      />
      <button
        onClick={() => setSeed((s) => s + 1)}
        className="absolute top-2 right-2 text-xs px-2 py-1 rounded border bg-white"
        style={{ borderColor: 'var(--color-main)', color: 'var(--color-main)' }}
      >
        Refresh
      </button>
    </div>
  )
}
