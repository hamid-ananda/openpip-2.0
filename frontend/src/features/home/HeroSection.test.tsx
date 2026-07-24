import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { HeroSection } from './HeroSection'

vi.mock('./MiniNetworkGraph', () => ({
  MiniNetworkGraph: () => <div data-testid="mini-network-graph" />,
}))

vi.mock('../../api/proteins', () => ({
  useAutocomplete: (q: string) => ({
    data: q.length >= 2 ? ['BAD', 'BAK1', 'BAX'] : [],
  }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
}

describe('HeroSection', () => {
  it('renders the site short title', () => {
    render(<HeroSection shortTitle="openPIP" proteins={8275} interactions={52569} datasets={0} />, { wrapper })
    expect(screen.getByText('openPIP')).toBeInTheDocument()
  })

  it('renders the search input', () => {
    render(<HeroSection shortTitle="openPIP" proteins={0} interactions={0} datasets={0} />, { wrapper })
    expect(screen.getByPlaceholderText(/gene names/i)).toBeInTheDocument()
  })

  it('renders the search button', () => {
    render(<HeroSection shortTitle="openPIP" proteins={0} interactions={0} datasets={0} />, { wrapper })
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('shows gene autocomplete suggestions and fills the input on select', () => {
    render(<HeroSection shortTitle="openPIP" proteins={0} interactions={0} datasets={0} />, { wrapper })
    const input = screen.getByPlaceholderText(/gene names/i)
    fireEvent.change(input, { target: { value: 'BA' } })
    const option = screen.getByRole('option', { name: 'BAK1' })
    fireEvent.mouseDown(option)
    expect(input).toHaveValue('BAK1')
  })

  it('autocompletes only the last token in a multi-gene query', () => {
    render(<HeroSection shortTitle="openPIP" proteins={0} interactions={0} datasets={0} />, { wrapper })
    const input = screen.getByPlaceholderText(/gene names/i)
    fireEvent.change(input, { target: { value: 'TP53, BA' } })
    fireEvent.mouseDown(screen.getByRole('option', { name: 'BAX' }))
    expect(input).toHaveValue('TP53, BAX')
  })
})
