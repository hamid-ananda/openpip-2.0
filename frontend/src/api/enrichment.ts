import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

// g:Profiler Gene Ontology enrichment
export interface GOTerm {
  name: string
  source: string   // 'GO:BP', 'GO:MF', 'GO:CC'
  p_value: number
  term_id: string
}

export function useGOEnrichment(geneNames: string[]) {
  return useQuery({
    queryKey: ['go-enrichment', geneNames],
    queryFn: async () => {
      const response = await axios.post(
        'https://biit.cs.ut.ee/gprofiler/api/gost/profile/',
        {
          organism: 'hsapiens',
          query: geneNames,
          sources: ['GO:BP', 'GO:MF', 'GO:CC'],
          user_threshold: 0.05,
          significance_threshold_method: 'fdr',
        }
      )
      // g:Profiler response: { result: [{ name, source, p_value, native: "GO:XXXX" }] }
      const results = response.data?.result ?? []
      return results.map((r: Record<string, unknown>) => ({
        name: r.name as string,
        source: r.source as string,
        p_value: r.p_value as number,
        term_id: r.native as string,
      })) as GOTerm[]
    },
    enabled: geneNames.length > 0,
    staleTime: 5 * 60 * 1000,  // 5 min — external API
  })
}

// Reactome pathway enrichment
export interface Pathway {
  stId: string
  name: string
  pValue: number
  entities_found: number
  entities_total: number
}

export function usePathwayEnrichment(geneNames: string[]) {
  return useQuery({
    queryKey: ['pathway-enrichment', geneNames],
    queryFn: async () => {
      // Reactome expects identifiers as a plain text body (one per line or comma-separated)
      const response = await axios.post(
        'https://reactome.org/AnalysisService/identifiers/?pageSize=20&page=1',
        geneNames.join('\n'),
        { headers: { 'Content-Type': 'text/plain' } }
      )
      const pathways = response.data?.pathways ?? []
      return pathways.map((p: Record<string, unknown>) => ({
        stId: p.stId as string,
        name: p.name as string,
        pValue: p.entities ? (p.entities as Record<string, unknown>).pValue as number : 1,
        entities_found: p.entities ? (p.entities as Record<string, unknown>).found as number : 0,
        entities_total: p.entities ? (p.entities as Record<string, unknown>).total as number : 0,
      })) as Pathway[]
    },
    enabled: geneNames.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

// CORUM complex enrichment — CORUM doesn't have a live REST API for enrichment.
// We simulate by filtering CORUM data client-side.
// For Phase 1 parity: show a placeholder message that this feature requires
// downloading the CORUM database. Return an empty array.
export interface ProteinComplex {
  complexId: string
  complexName: string
  subunits: string[]
}

export function useCORUMEnrichment(geneNames: string[]) {
  return useQuery({
    queryKey: ['corum-enrichment', geneNames],
    queryFn: async (): Promise<ProteinComplex[]> => {
      // Phase 1: CORUM requires server-side enrichment (Phase 2 Celery task)
      // Return empty to show the "not available" message
      return []
    },
    enabled: geneNames.length > 0,
    staleTime: Infinity,
  })
}
