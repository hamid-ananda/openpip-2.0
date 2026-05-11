import { http, HttpResponse } from 'msw'
import { settingsFixture } from '../fixtures/settings'

export const settingsHandlers = [
  http.get('/api/settings', () => HttpResponse.json(settingsFixture)),
]
