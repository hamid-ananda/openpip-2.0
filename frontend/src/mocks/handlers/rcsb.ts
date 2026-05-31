import { http, HttpResponse } from 'msw'

interface RcsbQueryBody {
  query?: { parameters?: { value?: string[] } }
}

// Fixture: Q92934 (BAD) → PDB 2BID; anything else → no results
export const rcsbHandlers = [
  http.post('https://search.rcsb.org/rcsbsearch/v2/query', async ({ request }) => {
    const body = (await request.json()) as RcsbQueryBody
    const uniprotId = body?.query?.parameters?.value?.[0]

    if (uniprotId === 'Q92934') {
      return HttpResponse.json({
        total_count: 1,
        result_set: [{ identifier: '2BID', score: 1 }],
      })
    }

    return HttpResponse.json({ total_count: 0, result_set: [] })
  }),

  // AlphaFold prediction API — returns the canonical CIF URL for a UniProt ID
  http.get('https://alphafold.ebi.ac.uk/api/prediction/:uniprotId', ({ params }) => {
    const { uniprotId } = params as { uniprotId: string }
    return HttpResponse.json([
      {
        cifUrl: `https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v4.cif`,
      },
    ])
  }),
]
