import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProfilePage } from '../ProfilePage'
import { useAuthStore } from '../../../store/authStore'

vi.mock('../../../api/auth', () => ({
  useProfile: vi.fn(),
  useLogout: vi.fn(),
}))

import { useProfile, useLogout } from '../../../api/auth'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.mocked(useLogout).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useLogout>)
})

describe('ProfilePage', () => {
  it('shows loading state while profile is fetching', () => {
    useAuthStore.setState({ isLoggedIn: true, isAdmin: false, token: 'mock-token' })

    vi.mocked(useProfile).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useProfile>)

    render(<ProfilePage />, { wrapper })

    expect(screen.getByText(/loading profile/i)).toBeInTheDocument()
  })

  it('shows username when profile loads', () => {
    useAuthStore.setState({ isLoggedIn: true, isAdmin: false, token: 'mock-token' })

    vi.mocked(useProfile).mockReturnValue({
      data: { username: 'testuser', email: 'a@b.com', is_admin: false },
      isLoading: false,
    } as unknown as ReturnType<typeof useProfile>)

    render(<ProfilePage />, { wrapper })

    expect(screen.getByText('testuser')).toBeInTheDocument()
  })
})
