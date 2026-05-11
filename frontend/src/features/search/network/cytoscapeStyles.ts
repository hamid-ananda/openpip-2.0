import type { StylesheetJsonBlock } from 'cytoscape'

export const NETWORK_STYLESHEET: StylesheetJsonBlock[] = [
  {
    selector: 'node',
    style: {
      'background-color': '#888888',
      color: '#ffffff',
      label: 'data(label)',
      'text-outline-width': 1,
      'text-outline-color': '#333333',
      'font-size': 10,
      width: 36,
      height: 36,
      'text-valign': 'center',
      'text-halign': 'center',
    },
  },
  {
    selector: 'node[?isQuery]',
    style: {
      'background-color': 'var(--color-query-node)',
    },
  },
  {
    selector: 'node[!isQuery]',
    style: {
      'background-color': 'var(--color-interactor-node)',
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 2,
      'border-color': '#ffff00',
    },
  },
  {
    selector: 'edge',
    style: {
      'line-color': 'data(color)',
      width: 2,
      opacity: 0.8,
      'curve-style': 'bezier',
    },
  },
  {
    selector: 'edge:selected',
    style: {
      width: 4,
      opacity: 1.0,
    },
  },
]
