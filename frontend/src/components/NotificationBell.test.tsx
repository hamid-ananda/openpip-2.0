import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { NotificationBell } from './NotificationBell'
import { useAuthStore } from '../store/authStore'
import { resetSharingStore, seedSharing } from '../mocks/handlers/sharing'

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('NotificationBell', () => {
  beforeEach(() => {
    resetSharingStore()
    useAuthStore.setState({ isLoggedIn: true, isAdmin: false, token: 'mock-token' })
  })

  it('counts the unread ones and lists them', async () => {
    seedSharing({
      notifications: [
        { id: 1, text: 'Helen shared "MAPK cluster" with you', link: '/shared/3', read: false, created_at: '2026-08-27T00:00:00Z' },
        { id: 2, text: 'Helen commented on "MAPK cluster"', link: '/shared/3', read: true, created_at: '2026-08-26T00:00:00Z' },
      ],
    })
    render(<NotificationBell />, { wrapper: Wrapper })

    const bell = await screen.findByRole('button', { name: /1 unread/i })
    fireEvent.click(bell)
    expect(await screen.findByText(/shared "MAPK cluster" with you/)).toBeInTheDocument()
  })

  it('shows nothing to a signed-out visitor', () => {
    useAuthStore.setState({ isLoggedIn: false, isAdmin: false, token: null })
    const { container } = render(<NotificationBell />, { wrapper: Wrapper })
    expect(container).toBeEmptyDOMElement()
  })

  it('says when there is nothing waiting', async () => {
    seedSharing({ notifications: [] })
    render(<NotificationBell />, { wrapper: Wrapper })
    fireEvent.click(await screen.findByRole('button', { name: /notifications/i }))
    expect(await screen.findByText(/nothing yet/i)).toBeInTheDocument()
  })
})
