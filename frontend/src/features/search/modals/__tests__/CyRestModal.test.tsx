import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CyRestModal } from '../CyRestModal'
import { useSearchStore } from '../../searchStore'
import { renderWithProviders } from '../../../../test/renderWithProviders'

const proteins = [
  { protein_id: 1, protein_gene_name: 'AKT1' },
  { protein_id: 2, protein_gene_name: 'TP53' },
] as never

const interactions = [
  {
    interaction_id: 7,
    interactor_A: { protein_id: 1, protein_gene_name: 'AKT1' },
    interactor_B: { protein_id: 2, protein_gene_name: 'TP53' },
    score: 0.9,
    interaction_category_array: { highest_category_status: 'published', highest_order: 1 },
  },
] as never

describe('CyRestModal', () => {
  beforeEach(() => {
    useSearchStore.setState({
      allProteins: proteins,
      allInteractions: interactions,
      queryProteinIds: [1],
      searchTerm: 'AKT1',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('posts Cytoscape.js JSON with nodes and edges split apart', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    renderWithProviders(<CyRestModal onClose={() => {}} />)
    fireEvent.click(screen.getByText('Import'))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://127.0.0.1:1234/v1/networks')
    const body = JSON.parse(init.body)
    expect(body.data.name).toBe('openPIP: AKT1')
    expect(body.elements.nodes.map((n) => n.data.name)).toEqual(['AKT1', 'TP53'])
    expect(body.elements.edges).toHaveLength(1)
    expect(body.elements.edges[0].data).toMatchObject({
      source: 'p1',
      target: 'p2',
      interaction: 'published',
    })
  })

  it('reports the status code when Cytoscape rejects the import', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 415 }))

    renderWithProviders(<CyRestModal onClose={() => {}} />)
    fireEvent.click(screen.getByText('Import'))

    expect(await screen.findByText(/HTTP 415/)).toBeInTheDocument()
  })

  it('explains the connection failure when Cytoscape is not running', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    renderWithProviders(<CyRestModal onClose={() => {}} />)
    fireEvent.click(screen.getByText('Import'))

    expect(await screen.findByText(/Could not reach Cytoscape/)).toBeInTheDocument()
  })
})
