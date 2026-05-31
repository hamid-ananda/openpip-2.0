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
]
