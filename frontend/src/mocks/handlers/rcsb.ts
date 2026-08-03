import { http, HttpResponse } from 'msw'

interface RcsbSearchBody {
  query?: { parameters?: { value?: string[] } }
}

// Fixture: Q92934 (BAD) → PDB 2BID; anything else → no results
export const rcsbHandlers = [
  // RCSB text-search API - used by useStructureAvailability to find the best
  // experimental structure for a UniProt accession.
  http.post('https://search.rcsb.org/rcsbsearch/v2/query', async ({ request }) => {
    const body = (await request.json()) as RcsbSearchBody
    const accession = body?.query?.parameters?.value?.[0]

    if (accession === 'Q92934') {
      return HttpResponse.json({
        total_count: 1,
        result_set: [{ identifier: '2BID', score: 1 }],
      })
    }

    return HttpResponse.json({ total_count: 0, result_set: [] })
  }),

  // AlphaFold prediction API - model URLs plus the confidence breakdown and
  // provenance the structure panel renders.
  http.get('https://alphafold.ebi.ac.uk/api/prediction/:uniprotId', ({ params }) => {
    const { uniprotId } = params as { uniprotId: string }
    const entryId = `AF-${uniprotId}-F1`
    return HttpResponse.json([
      {
        entryId,
        gene: 'BAD',
        uniprotAccession: uniprotId,
        uniprotId: `${uniprotId}_HUMAN`,
        uniprotDescription: 'Test protein',
        organismScientificName: 'Homo sapiens',
        sequenceStart: 1,
        sequenceEnd: 168,
        globalMetricValue: 75.06,
        fractionPlddtVeryHigh: 0.527,
        fractionPlddtConfident: 0.071,
        fractionPlddtLow: 0.104,
        fractionPlddtVeryLow: 0.298,
        latestVersion: 6,
        modelCreatedDate: '2025-08-01T00:00:00Z',
        toolUsed: 'AlphaFold Monomer v2.0 pipeline',
        cifUrl: `https://alphafold.ebi.ac.uk/files/${entryId}-model_v6.cif`,
        pdbUrl: `https://alphafold.ebi.ac.uk/files/${entryId}-model_v6.pdb`,
        bcifUrl: `https://alphafold.ebi.ac.uk/files/${entryId}-model_v6.bcif`,
        paeImageUrl: `https://alphafold.ebi.ac.uk/files/${entryId}-predicted_aligned_error_v6.png`,
        paeDocUrl: `https://alphafold.ebi.ac.uk/files/${entryId}-predicted_aligned_error_v6.json`,
      },
    ])
  }),
]
