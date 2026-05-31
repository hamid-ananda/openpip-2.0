import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { useStructureAvailability } from '../useStructureAvailability'

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
})
