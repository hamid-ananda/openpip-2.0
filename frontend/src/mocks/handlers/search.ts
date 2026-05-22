import { http, HttpResponse } from 'msw'
import { searchFixture, emptySearchFixture, autocompleteFixture } from '../fixtures/search'

export const searchHandlers = [
  http.get('/api/home/network', () => HttpResponse.json(searchFixture)),

  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q') ?? ''
    return HttpResponse.json(q.trim() ? searchFixture : emptySearchFixture)
  }),

  http.post('/api/search/interactors', () => HttpResponse.json(searchFixture)),

  http.get('/api/proteins/autocomplete', ({ request }) => {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').toUpperCase()
    return HttpResponse.json(autocompleteFixture.filter(g => g.startsWith(q)))
  }),
]
