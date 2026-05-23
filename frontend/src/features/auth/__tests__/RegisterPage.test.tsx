import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { RegisterPage } from '../RegisterPage'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('RegisterPage', () => {
  it('renders all form fields', () => {
    render(<RegisterPage />, { wrapper })
    expect(screen.getByText('Username')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByText('Confirm password')).toBeInTheDocument()
  })

  it('shows the benefits panel', () => {
    render(<RegisterPage />, { wrapper })
    expect(screen.getByText('Bulk downloads')).toBeInTheDocument()
    expect(screen.getByText('Saved queries')).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    render(<RegisterPage />, { wrapper })
    const [pwField, confirmField] = screen.getAllByDisplayValue('')
    // fill username
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'alice' } })
    // fill email
    fireEvent.change(screen.getByPlaceholderText('you@university.edu'), {
      target: { value: 'alice@example.com' },
    })
    // fill password fields (type=password, not role=textbox)
    const pwInputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(pwInputs[0], { target: { value: 'Secret1!' } })
    fireEvent.change(pwInputs[1], { target: { value: 'Different1!' } })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    )
  })

  it('shows success state after successful registration', async () => {
    render(<RegisterPage />, { wrapper })
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'alice' } })
    fireEvent.change(screen.getByPlaceholderText('you@university.edu'), {
      target: { value: 'alice@example.com' },
    })
    const pwInputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(pwInputs[0], { target: { value: 'Secret1!' } })
    fireEvent.change(pwInputs[1], { target: { value: 'Secret1!' } })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(screen.getByText('Account created')).toBeInTheDocument()
    )
    expect(screen.getByRole('link', { name: /sign in now/i })).toBeInTheDocument()
  })

  it('has a link to the login page', () => {
    render(<RegisterPage />, { wrapper })
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })
})
