import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NetworkToolbar } from '../NetworkToolbar'

// Mock all child dropdowns to avoid testing their internals
vi.mock('../SearchDropdown', () => ({ SearchDropdown: () => <div>SearchDropdown</div> }))
vi.mock('../FilterDropdown', () => ({ FilterDropdown: () => <div>FilterDropdown</div> }))
vi.mock('../LayoutDropdown', () => ({ LayoutDropdown: () => <div>LayoutDropdown</div> }))
vi.mock('../DownloadDropdown', () => ({ DownloadDropdown: () => <div>DownloadDropdown</div> }))
vi.mock('../LegendDropdown', () => ({ LegendDropdown: () => <div>LegendDropdown</div> }))
vi.mock('../SummaryDropdown', () => ({ SummaryDropdown: () => <div>SummaryDropdown</div> }))
vi.mock('../ExternalLinksDropdown', () => ({
  ExternalLinksDropdown: () => <div>ExternalLinksDropdown</div>,
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('NetworkToolbar', () => {
  it('renders all toolbar sections', () => {
    render(<NetworkToolbar searchTerm="BAD" />, { wrapper: Wrapper })
    expect(screen.getByText('SearchDropdown')).toBeInTheDocument()
    expect(screen.getByText('FilterDropdown')).toBeInTheDocument()
    expect(screen.getByText('LayoutDropdown')).toBeInTheDocument()
    expect(screen.getByText('DownloadDropdown')).toBeInTheDocument()
    expect(screen.getByText('LegendDropdown')).toBeInTheDocument()
    expect(screen.getByText('SummaryDropdown')).toBeInTheDocument()
    expect(screen.getByText('ExternalLinksDropdown')).toBeInTheDocument()
  })
})
