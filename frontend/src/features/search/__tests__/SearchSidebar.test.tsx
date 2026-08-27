import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { SearchSidebar } from '../SearchSidebar'

const navigate = vi.fn()
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useNavigate: () => navigate,
}))

vi.mock('../../../api/proteins', () => ({
  useAutocomplete: (q: string) => ({ data: q.length >= 2 ? ['BAD', 'BAK1', 'BAX'] : [] }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('SearchSidebar query autocomplete', () => {
  it('suggests genes and fills the query input on select', () => {
    render(<SearchSidebar term="" visibleInteractionIds={[]} />, { wrapper })
    const input = screen.getByPlaceholderText(/Gene symbol or UniProt ID/i)
    fireEvent.change(input, { target: { value: 'BA' } })
    fireEvent.mouseDown(screen.getByRole('option', { name: 'BAK1' }))
    expect(input).toHaveValue('BAK1')
  })
})

describe('SearchSidebar multi-line query box', () => {
  it('searches on Enter and keeps shift-enter for a newline', () => {
    navigate.mockClear()
    render(<SearchSidebar term="" visibleInteractionIds={[]} />, { wrapper })
    const box = screen.getByPlaceholderText(/Gene symbol or UniProt ID/i)

    fireEvent.change(box, { target: { value: 'BAD\nBCL2L1' } })
    fireEvent.keyDown(box, { key: 'Enter', shiftKey: true })
    expect(navigate).not.toHaveBeenCalled()

    fireEvent.keyDown(box, { key: 'Enter' })
    expect(navigate).toHaveBeenCalledWith(`/search/${encodeURIComponent('BAD\nBCL2L1')}`)
  })
})

describe('SearchSidebar ribbon variant', () => {
  it('hides each section behind a button until it is pressed', () => {
    render(<SearchSidebar term="BAD" visibleInteractionIds={[]} variant="ribbon" />, { wrapper })

    // The query box is in the ribbon, but only once its button is pressed.
    expect(screen.queryByPlaceholderText(/Gene symbol or UniProt ID/i)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^Query$/i }))
    expect(screen.getByPlaceholderText(/Gene symbol or UniProt ID/i)).toBeInTheDocument()

    // Tools a search unlocks are here too, not only in the sidebar.
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
  })

  it('opens a section on hover, without a press', async () => {
    const user = userEvent.setup()
    render(<SearchSidebar term="BAD" visibleInteractionIds={[]} variant="ribbon" />, { wrapper })

    await user.hover(screen.getByRole('button', { name: /^Query$/i }))
    expect(screen.getByPlaceholderText(/Gene symbol or UniProt ID/i)).toBeInTheDocument()

    await user.unhover(screen.getByRole('button', { name: /^Query$/i }))
    expect(screen.queryByPlaceholderText(/Gene symbol or UniProt ID/i)).toBeNull()
  })

  it('folds the whole row away and back', () => {
    render(<SearchSidebar term="BAD" visibleInteractionIds={[]} variant="ribbon" />, { wrapper })

    fireEvent.click(screen.getByRole('button', { name: /hide filters/i }))
    expect(screen.queryByRole('button', { name: /^Query$/i })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /show filters/i }))
    expect(screen.getByRole('button', { name: /^Query$/i })).toBeInTheDocument()
  })

  it('leaves the sidebar showing its sections without a press', () => {
    render(<SearchSidebar term="BAD" visibleInteractionIds={[]} />, { wrapper })
    expect(screen.getByPlaceholderText(/Gene symbol or UniProt ID/i)).toBeInTheDocument()
  })
})
