import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { useEnrichment } from '../enrichment'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useEnrichment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is disabled when geneNames is empty', () => {
    const { result } = renderHook(() => useEnrichment([]), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })

  it('calls g:Profiler with all legacy sources: GO:BP, GO:MF, GO:CC, KEGG, REAC, CORUM', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { result: [] } })
    const { result } = renderHook(() => useEnrichment(['BAD', 'BCL2L1']), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://biit.cs.ut.ee/gprofiler/api/gost/profile/',
      expect.objectContaining({
        organism: 'hsapiens',
        query: ['BAD', 'BCL2L1'],
        sources: ['GO:BP', 'GO:MF', 'GO:CC', 'KEGG', 'REAC', 'CORUM'],
      })
    )
  })

  it('maps g:Profiler response correctly', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: {
        result: [
          { name: 'apoptotic process', source: 'GO:BP', p_value: 0.001, native: 'GO:0006915' },
          { name: 'Cell Cycle', source: 'REAC', p_value: 0.003, native: 'R-HSA-1640170' },
          { name: 'Proteasome', source: 'CORUM', p_value: 0.01, native: 'CORUM:3' },
          { name: 'MAPK signaling', source: 'KEGG', p_value: 0.02, native: 'KEGG:hsa04010' },
        ],
      },
    })

    const { result } = renderHook(() => useEnrichment(['BAD', 'BCL2L1']), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(4)
    expect(result.current.data![0]).toEqual({
      name: 'apoptotic process',
      source: 'GO:BP',
      p_value: 0.001,
      term_id: 'GO:0006915',
    })
    expect(result.current.data![1]).toEqual({
      name: 'Cell Cycle',
      source: 'REAC',
      p_value: 0.003,
      term_id: 'R-HSA-1640170',
    })
    expect(result.current.data![2]).toEqual({
      name: 'Proteasome',
      source: 'CORUM',
      p_value: 0.01,
      term_id: 'CORUM:3',
    })
    expect(result.current.data![3]).toEqual({
      name: 'MAPK signaling',
      source: 'KEGG',
      p_value: 0.02,
      term_id: 'KEGG:hsa04010',
    })
  })

  it('returns empty array when g:Profiler returns no results', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { result: [] } })
    const { result } = renderHook(() => useEnrichment(['UNKNOWN_GENE']), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})
