import type { ReactElement, ReactNode } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

interface Options {
  /** Wrap in a MemoryRouter. Defaults to true. */
  router?: boolean
  /** Initial route for the MemoryRouter. */
  route?: string
}

/**
 * Renders a component with the providers nearly every component needs:
 * TanStack Query (site settings, site text) and a router.
 *
 * Retries are off so a failing request surfaces immediately instead of hanging
 * the test.
 */
export function renderWithProviders(ui: ReactElement, { router = true, route = '/' }: Options = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const wrap = (children: ReactNode) =>
    router ? <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter> : children

  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{wrap(ui)}</QueryClientProvider>),
  }
}
