import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { HomePage } from './HomePage'

vi.mock('./MiniNetworkGraph', () => ({
  MiniNetworkGraph: () => <div data-testid="mini-network-graph" />,
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
}

describe('HomePage', () => {
  it('renders the site short title from MSW settings', async () => {
    render(<HomePage />, { wrapper })
    await waitFor(() => expect(screen.getByText('HuRI')).toBeInTheDocument())
  })

  it('renders formatted protein count from MSW counts', async () => {
    render(<HomePage />, { wrapper })
    await waitFor(() => expect(screen.getByText('8,275')).toBeInTheDocument())
  })

  it('renders announcements from MSW', async () => {
    render(<HomePage />, { wrapper })
    await waitFor(() => expect(screen.getByText('Welcome to openPIP 2.0')).toBeInTheDocument())
  })
})
