import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SearchDropdown } from '../SearchDropdown'

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('SearchDropdown', () => {
  it('renders the Search button', () => {
    render(<SearchDropdown currentTerm="BAD" />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: /^search$/i })).toBeInTheDocument()
  })

  it('opens the input panel when button is clicked', () => {
    render(<SearchDropdown currentTerm="BAD" />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: /^search$/i }))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('initializes the input with the currentTerm prop', () => {
    render(<SearchDropdown currentTerm="TP53" />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: /^search$/i }))
    expect(screen.getByRole('textbox')).toHaveValue('TP53')
  })
})
