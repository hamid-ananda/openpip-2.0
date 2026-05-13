import { http, HttpResponse } from 'msw'
import { adminAnnouncementsFixture, announcementsFixture } from '../fixtures/announcements'

export const announcementsHandlers = [
  http.get('/api/announcements', () => HttpResponse.json(announcementsFixture)),
  http.get('/api/admin/announcements', () => HttpResponse.json(adminAnnouncementsFixture)),
  http.post('/api/admin/announcements', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ id: 99, show: true, showOnHomePage: false, date: null, ...body }, { status: 201 })
  }),
  http.patch('/api/admin/announcements/:id', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ id: 1, title: 'Patched', text: 'text', date: null, show: true, showOnHomePage: false, ...body })
  }),
  http.delete('/api/admin/announcements/:id', () => new HttpResponse(null, { status: 204 })),
]
