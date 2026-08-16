import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ContactPage } from '../ContactPage'

vi.mock('../../../api/settings', () => ({
  useSettings: vi.fn(),
}))

import { useSettings } from '../../../api/settings'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function mockContact(contact: string | null) {
  vi.mocked(useSettings).mockReturnValue({
    data: { contact },
  } as unknown as ReturnType<typeof useSettings>)
}

describe('ContactPage', () => {
  it('renders the admin-editable contact HTML', () => {
    mockContact('<p>Please contact <a href="mailto:a@b.ca">Someone</a>.</p>')

    render(<ContactPage />, { wrapper })

    expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Someone' })).toHaveAttribute('href', 'mailto:a@b.ca')
  })

  it('renders just the heading when no contact text is set', () => {
    mockContact(null)

    render(<ContactPage />, { wrapper })

    expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
