import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { HeroSection } from './HeroSection'

vi.mock('./MiniNetworkGraph', () => ({
  MiniNetworkGraph: () => <div data-testid="mini-network-graph" />,
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
})
