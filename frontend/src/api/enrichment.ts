import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export type EnrichmentSource = 'GO:BP' | 'GO:MF' | 'GO:CC' | 'KEGG' | 'REAC' | 'CORUM'

export interface EnrichmentTerm {
  name: string
  source: EnrichmentSource
  p_value: number
  term_id: string
}

const GPROFILER_SOURCES: EnrichmentSource[] = ['GO:BP', 'GO:MF', 'GO:CC', 'KEGG', 'REAC', 'CORUM']

export function useEnrichment(geneNames: string[]) {
  return useQuery({
    queryKey: ['enrichment', geneNames],
    queryFn: async () => {
      const response = await axios.post(
        'https://biit.cs.ut.ee/gprofiler/api/gost/profile/',
        {
          organism: 'hsapiens',
          query: geneNames,
          sources: GPROFILER_SOURCES,
          user_threshold: 0.05,
          significance_threshold_method: 'fdr',
        }
      )
      const results = response.data?.result ?? []
      return results.map((r: Record<string, unknown>) => ({
        name: r.name as string,
        source: r.source as EnrichmentSource,
        p_value: r.p_value as number,
        term_id: r.native as string,
      })) as EnrichmentTerm[]
    },
    enabled: geneNames.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

// Legacy aliases kept for backward compatibility
export type GOTerm = EnrichmentTerm
export const useGOEnrichment = useEnrichment
