import { http, HttpResponse } from 'msw'
import { searchFixture, emptySearchFixture, autocompleteFixture } from '../fixtures/search'

export const searchHandlers = [
  http.get('/api/home/network', () => HttpResponse.json(searchFixture)),

  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q') ?? ''
    const terms = q.split(',').map(t => t.trim().toUpperCase())
    const hasKnown = terms.some(t => ['BAD', 'BCL2L1', 'BCL2L2', 'BAK1', 'BMF', 'MCL1'].includes(t))
    return HttpResponse.json(hasKnown ? searchFixture : emptySearchFixture)
  }),

  http.post('/api/search/interactors', () => HttpResponse.json(searchFixture)),

  http.get('/api/proteins/autocomplete', ({ request }) => {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').toUpperCase()
    return HttpResponse.json(autocompleteFixture.filter(g => g.startsWith(q)))
  }),
]
