import { useQuery } from '@tanstack/react-query'

interface RcsbSearchResponse {
  total_count: number
  result_set: Array<{ identifier: string; score: number }>
}

async function fetchBestPdbId(uniprotId: string): Promise<string | null> {
  const res = await fetch('https://search.rcsb.org/rcsbsearch/v2/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: {
        type: 'terminal',
        service: 'text',
        parameters: {
          attribute: 'rcsb_polymer_entity_container_identifiers.uniprot_ids',
          operator: 'in',
          negation: false,
          value: [uniprotId],
        },
      },
      return_type: 'entry',
      request_options: {
        paginate: { start: 0, rows: 1 },
        sort: [{ sort_by: 'score', direction: 'desc' }],
      },
    }),
  })

  if (!res.ok) throw new Error(`RCSB search failed: ${res.status}`)

  const data: RcsbSearchResponse = await res.json()
  return data.result_set?.[0]?.identifier?.trim() || null
}

export function useStructureAvailability(uniprotId: string): {
  pdbId: string | null
  loading: boolean
  error: boolean
} {
  const { data, isLoading, isError } = useQuery<string | null>({
    queryKey: ['rcsb-pdb', uniprotId],
    queryFn: () => fetchBestPdbId(uniprotId),
    staleTime: 86_400_000,
    retry: 1,
    enabled: !!uniprotId,
  })

  return {
    pdbId: data ?? null,
    loading: isLoading,
    error: isError,
  }
}
