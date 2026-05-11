import { http, HttpResponse } from 'msw'
import { countsFixture } from '../fixtures/counts'

export const countsHandlers = [
  http.get('/api/counts', () => HttpResponse.json(countsFixture)),
]
