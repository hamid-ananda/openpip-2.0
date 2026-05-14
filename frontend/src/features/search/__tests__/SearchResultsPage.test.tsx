import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useSearch } from '../../../api/search'
import { SearchResultsPage } from '../SearchResultsPage'
import { searchFixture } from '../../../mocks/fixtures/search'
import { useSearchStore } from '../searchStore'

vi.mock('../SearchSidebar', () => ({ SearchSidebar: () => <div>Sidebar</div> }))
vi.mock('../network/CytoscapeNetwork', () => ({ CytoscapeNetwork: () => <div>Network</div> }))
vi.mock('../tables/ResultTablePanel', () => ({ ResultTablePanel: () => <div>Tables</div> }))
vi.mock('../enrichment/EnrichmentPanel', () => ({ EnrichmentPanel: () => <div>Enrichment</div> }))
vi.mock('../modals/OverlaySystem', () => ({ OverlaySystem: () => null }))
vi.mock('../../../api/search', () => ({ useSearch: vi.fn() }))

// Mock cytoscape and react-cytoscapejs to avoid canvas/DOM issues in jsdom
vi.mock('react-cytoscapejs', () => ({ default: () => null }))
vi.mock('cytoscape', () => ({ default: { use: vi.fn() } }))
vi.mock('cytoscape-cola', () => ({ default: {} }))

function renderWithRoute(term?: string) {
  if (term) {
    return render(
      <MemoryRouter initialEntries={[`/search/${term}`]}>
        <Routes>
          <Route path="/search/:term" element={<SearchResultsPage />} />
        </Routes>
      </MemoryRouter>
    )
  }
  // No route param — render at a path that doesn't match :term
  return render(
    <MemoryRouter initialEntries={['/search']}>
      <Routes>
        <Route path="/search" element={<SearchResultsPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('SearchResultsPage', () => {
  beforeEach(() => {
    // Reset store between tests
    useSearchStore.getState().reset()
    vi.clearAllMocks()
  })

  it('shows loading spinner when isLoading is true', () => {
    ;(useSearch as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    renderWithRoute('BAD')

    expect(screen.getByText('Querying interactome...')).toBeInTheDocument()
  })

  it('shows error message when isError is true', () => {
    ;(useSearch as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    renderWithRoute('BAD')

    expect(screen.getByText(/Could not reach the database/i)).toBeInTheDocument()
  })

  it('shows "Enter a search term" when term is empty (no route param)', () => {
    ;(useSearch as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })

    renderWithRoute() // no term

    expect(screen.getByText(/Search for a protein to see its interaction network/i)).toBeInTheDocument()
  })

  it('calls setSearchData and renders all panels when data loads', async () => {
    ;(useSearch as ReturnType<typeof vi.fn>).mockReturnValue({
      data: searchFixture,
      isLoading: false,
      isError: false,
    })

    renderWithRoute('BAD,BCL2L1')

    // Panels should be in the document
    expect(screen.getByText('Sidebar')).toBeInTheDocument()
    expect(screen.getByText('Network')).toBeInTheDocument()
    expect(screen.getByText('Tables')).toBeInTheDocument()
    expect(screen.getByText('Enrichment')).toBeInTheDocument()

    // Store should have been populated with fixture data
    const state = useSearchStore.getState()
    expect(state.allProteins).toHaveLength(searchFixture.all_proteins.length)
    expect(state.allInteractions).toHaveLength(searchFixture.all_interactions.length)
    expect(state.searchTerm).toBe(searchFixture.search_term)
  })
})
