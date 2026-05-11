import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { useCounts } from './counts'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useCounts', () => {
  it('returns protein and interaction counts from MSW', async () => {
    const { result } = renderHook(() => useCounts(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.proteins).toBeGreaterThan(0)
    expect(result.current.data?.interactions).toBeGreaterThan(0)
  })
})
