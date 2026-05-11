import { render, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { ThemeProvider } from './ThemeProvider'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('ThemeProvider', () => {
  it('injects CSS variables after fetching settings', async () => {
    render(
      <ThemeProvider>
        <div data-testid="child">hello</div>
      </ThemeProvider>,
      { wrapper }
    )
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--color-main')).toBe('#a51c30')
    })
  })
})
