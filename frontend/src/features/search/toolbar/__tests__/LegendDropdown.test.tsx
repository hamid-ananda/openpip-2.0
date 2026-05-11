import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LegendDropdown } from '../LegendDropdown'

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LegendDropdown', () => {
  it('renders the Legend button', () => {
    render(<LegendDropdown />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: /legend/i })).toBeInTheDocument()
  })

  it('shows the edge color legend panel when button is clicked', () => {
    render(<LegendDropdown />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: /legend/i }))
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Validated')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText('Literature')).toBeInTheDocument()
    expect(screen.getByText('Mixed')).toBeInTheDocument()
  })

  it('shows node color entries when panel is open', () => {
    render(<LegendDropdown />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: /legend/i }))
    expect(screen.getByText('Query protein')).toBeInTheDocument()
    expect(screen.getByText('Interactor protein')).toBeInTheDocument()
  })

  it('panel is not shown by default', () => {
    render(<LegendDropdown />, { wrapper: Wrapper })
    expect(screen.queryByText('Published')).not.toBeInTheDocument()
  })
})
