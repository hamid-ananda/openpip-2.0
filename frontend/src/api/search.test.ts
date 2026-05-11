import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { useSearch } from './search'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useSearch', () => {
  it('returns search results for known proteins', async () => {
    const { result } = renderHook(() => useSearch('BAD,BCL2L1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.all_proteins).toHaveLength(3)
    expect(result.current.data?.query_protein_id_array).toEqual([1, 2])
  })

  it('is disabled when term is empty', () => {
    const { result } = renderHook(() => useSearch(''), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
