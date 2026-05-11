import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { useGOEnrichment } from '../enrichment'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useGOEnrichment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is disabled when geneNames is empty', () => {
    const { result } = renderHook(() => useGOEnrichment([]), { wrapper })
    // Query should be idle (not fetching) because enabled: false
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })

  it('maps g:Profiler response correctly when gene names are provided', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: {
        result: [
          {
            name: 'apoptotic process',
            source: 'GO:BP',
            p_value: 0.001,
            native: 'GO:0006915',
          },
          {
            name: 'cytoplasm',
            source: 'GO:CC',
            p_value: 0.02,
            native: 'GO:0005737',
          },
        ],
      },
    })

    const { result } = renderHook(() => useGOEnrichment(['BAD', 'BCL2L1']), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)

    expect(result.current.data![0]).toEqual({
      name: 'apoptotic process',
      source: 'GO:BP',
      p_value: 0.001,
      term_id: 'GO:0006915',
    })

    expect(result.current.data![1]).toEqual({
      name: 'cytoplasm',
      source: 'GO:CC',
      p_value: 0.02,
      term_id: 'GO:0005737',
    })

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://biit.cs.ut.ee/gprofiler/api/gost/profile/',
      expect.objectContaining({
        organism: 'hsapiens',
        query: ['BAD', 'BCL2L1'],
        sources: ['GO:BP', 'GO:MF', 'GO:CC'],
      })
    )
  })

  it('returns empty array when g:Profiler returns no results', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { result: [] } })

    const { result } = renderHook(() => useGOEnrichment(['UNKNOWN_GENE']), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})
