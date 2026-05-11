import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginPage } from '../LoginPage'

vi.mock('../../../api/auth', () => ({
  useLogin: vi.fn(),
}))

import { useLogin } from '../../../api/auth'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LoginPage', () => {
  it('renders username and password fields', () => {
    vi.mocked(useLogin).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useLogin>)

    render(<LoginPage />, { wrapper })

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders submit button labeled "Log In"', () => {
    vi.mocked(useLogin).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useLogin>)

    render(<LoginPage />, { wrapper })

    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('shows error message when mutation returns error', () => {
    vi.mocked(useLogin).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: new Error('bad'),
    } as unknown as ReturnType<typeof useLogin>)

    render(<LoginPage />, { wrapper })

    expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument()
  })
})
