import { useQuery } from '@tanstack/react-query'
import { baseAccession } from './uniprot'

/**
 * A single AlphaFold DB prediction entry.
 *
 * Only the fields we render are typed; the endpoint returns considerably more.
 * See https://alphafold.ebi.ac.uk/api-docs
 */
export interface AlphaFoldEntry {
  entryId: string
  gene: string | null
  uniprotAccession: string
  uniprotId: string
  uniprotDescription: string | null
  organismScientificName: string | null
  sequenceStart: number
  sequenceEnd: number
  /** Mean pLDDT across the model, 0–100. */
  globalMetricValue: number | null
  fractionPlddtVeryHigh: number | null
  fractionPlddtConfident: number | null
  fractionPlddtLow: number | null
  fractionPlddtVeryLow: number | null
  latestVersion: number
  modelCreatedDate: string | null
  toolUsed: string | null
  cifUrl: string
  pdbUrl: string
  bcifUrl: string
  paeImageUrl: string | null
  paeDocUrl: string | null
}

/**
 * The four confidence bands AlphaFold reports, with the colours the AlphaFold
 * DB and Mol*'s `plddt-confidence` theme both use — so the legend matches what
 * is actually drawn in the viewer.
 */
export const PLDDT_BANDS = [
  { key: 'veryHigh', label: 'Very high', range: 'pLDDT > 90', color: '#0053d6' },
  { key: 'confident', label: 'Confident', range: '90 > pLDDT > 70', color: '#65cbf3' },
  { key: 'low', label: 'Low', range: '70 > pLDDT > 50', color: '#ffdb13' },
  { key: 'veryLow', label: 'Very low', range: 'pLDDT < 50', color: '#ff7d45' },
] as const

export type PlddtBandKey = (typeof PLDDT_BANDS)[number]['key']

/** Band fractions in legend order, skipping any the API did not report. */
export function plddtDistribution(entry: AlphaFoldEntry) {
  const fractions: Record<PlddtBandKey, number | null> = {
    veryHigh: entry.fractionPlddtVeryHigh,
    confident: entry.fractionPlddtConfident,
    low: entry.fractionPlddtLow,
    veryLow: entry.fractionPlddtVeryLow,
  }
  return PLDDT_BANDS.map((band) => ({
    ...band,
    fraction: fractions[band.key] ?? 0,
  })).filter((band) => band.fraction > 0)
}

/** Plain-language reading of a mean pLDDT score. */
export function confidenceSummary(meanPlddt: number | null): string {
  if (meanPlddt === null) return 'Confidence not reported'
  if (meanPlddt > 90) return 'Very high confidence overall'
  if (meanPlddt > 70) return 'Confident overall'
  if (meanPlddt > 50) return 'Low confidence; interpret with care'
  return 'Very low confidence; likely disordered'
}

async function fetchAlphaFoldEntry(uniprotId: string): Promise<AlphaFoldEntry | null> {
  const res = await fetch(
    `https://alphafold.ebi.ac.uk/api/prediction/${baseAccession(uniprotId)}`
  )
  // 404 is "no model for this accession", not a failure. Other non-OK statuses
  // (a malformed accession answers 400) throw and surface as a query error —
  // the panel renders the same "no model available" message either way.
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`AlphaFold lookup failed: ${res.status}`)

  const data = (await res.json()) as AlphaFoldEntry[]
  return data?.[0] ?? null
}

/**
 * AlphaFold metadata for a UniProt accession: model URLs, version, and the
 * per-residue confidence breakdown. Cached for a day — these change only when
 * AlphaFold publishes a new release.
 */
export function useAlphaFoldEntry(uniprotId: string) {
  return useQuery<AlphaFoldEntry | null>({
    queryKey: ['alphafold-entry', baseAccession(uniprotId)],
    queryFn: () => fetchAlphaFoldEntry(uniprotId),
    enabled: !!uniprotId,
    staleTime: 86_400_000,
    retry: 1,
  })
}
