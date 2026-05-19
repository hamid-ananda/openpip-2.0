import type { StylesheetJsonBlock } from 'cytoscape'

// Cytoscape renders to Canvas — CSS variables are NOT resolved.
// All colors must be concrete hex/rgb values.
export function buildStylesheet(
  queryNodeColor = '#e11d48',
  interactorNodeColor = '#2563eb',
): StylesheetJsonBlock[] {
  return [
    {
      selector: 'node',
      style: {
        'background-color': interactorNodeColor,
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
        'background-color': queryNodeColor,
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
}
