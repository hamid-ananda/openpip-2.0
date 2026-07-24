import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { SearchSidebar } from '../SearchSidebar'

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
