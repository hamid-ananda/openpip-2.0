import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ContactPage } from '../ContactPage'

vi.mock('../../../api/contact', () => ({
  useContact: vi.fn(),
}))

import { useContact } from '../../../api/contact'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ContactPage', () => {
  it('renders name, email, subject, and message fields', () => {
    vi.mocked(useContact).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      error: null,
    } as unknown as ReturnType<typeof useContact>)

    render(<ContactPage />, { wrapper })

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
  })

  it('renders the Send Message button', () => {
    vi.mocked(useContact).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      error: null,
    } as unknown as ReturnType<typeof useContact>)

    render(<ContactPage />, { wrapper })

    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('shows success state when isSuccess is true', () => {
    vi.mocked(useContact).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: true,
      error: null,
    } as unknown as ReturnType<typeof useContact>)

    render(<ContactPage />, { wrapper })

    expect(screen.getByText(/message sent/i)).toBeInTheDocument()
    expect(screen.getByText(/thank you for contacting us/i)).toBeInTheDocument()
  })
})
