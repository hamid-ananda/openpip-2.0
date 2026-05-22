import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { Navbar } from './Navbar'

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Navbar', () => {
  it('shows public links when logged out', () => {
    wrap(<Navbar isLoggedIn={false} />)
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /search/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /downloads/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument()
  })

  it('shows Profile and hides Login when logged in', () => {
    wrap(<Navbar isLoggedIn={true} />)
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument()
  })

  it('shows admin nav links when isAdmin is true', () => {
    wrap(<Navbar isLoggedIn={true} isAdmin={true} />)
    expect(screen.getByRole('link', { name: /announcements/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /data/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /files/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })

  it('hides admin nav links when isAdmin is false', () => {
    wrap(<Navbar isLoggedIn={true} isAdmin={false} />)
    expect(screen.queryByRole('link', { name: /announcements/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument()
  })
})
