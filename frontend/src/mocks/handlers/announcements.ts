import { http, HttpResponse } from 'msw'
import { announcementsFixture } from '../fixtures/announcements'

export const announcementsHandlers = [
  http.get('/api/announcements', () => HttpResponse.json(announcementsFixture)),
]
