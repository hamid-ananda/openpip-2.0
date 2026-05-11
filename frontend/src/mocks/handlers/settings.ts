import { http, HttpResponse } from 'msw'
import { settingsFixture } from '../fixtures/settings'

export const settingsHandlers = [
  http.get('/api/settings', () => HttpResponse.json(settingsFixture)),
  http.patch('/api/settings', async ({ request }) => {
    const body = await request.json()
    // Return the patched settings (merge with defaults)
    return HttpResponse.json({ ...settingsFixture, ...(body as object) })
  }),
]
