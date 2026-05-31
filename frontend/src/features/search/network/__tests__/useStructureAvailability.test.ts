import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { useStructureAvailability } from '../useStructureAvailability'
import { server } from '../../../../mocks/server'
import { http, HttpResponse } from 'msw'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useStructureAvailability', () => {
  it('returns the best PDB ID when RCSB has results for Q92934', async () => {
    const { result } = renderHook(() => useStructureAvailability('Q92934'), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.pdbId).toBe('2BID')
    expect(result.current.error).toBe(false)
  })

  it('returns null pdbId when no PDB structure exists', async () => {
    const { result } = renderHook(() => useStructureAvailability('P00000'), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.pdbId).toBeNull()
    expect(result.current.error).toBe(false)
  })

  it('is in loading state initially', () => {
    const { result } = renderHook(() => useStructureAvailability('Q92934'), { wrapper })
    expect(result.current.loading).toBe(true)
  })

  it('is idle (not loading) when uniprotId is empty', () => {
    const { result } = renderHook(() => useStructureAvailability(''), { wrapper })
    expect(result.current.loading).toBe(false)
  })

  it('returns error:true when RCSB returns a non-OK status', async () => {
    server.use(
      http.post('https://search.rcsb.org/rcsbsearch/v2/query', () => {
        return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
      })
    )
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useStructureAvailability('Q92934'), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: qc }, children),
    })
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 })
    expect(result.current.error).toBe(true)
    expect(result.current.pdbId).toBeNull()
  })
})
