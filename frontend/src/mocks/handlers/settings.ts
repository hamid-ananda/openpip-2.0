import { http, HttpResponse } from 'msw'
import { settingsFixture } from '../fixtures/settings'
import type { AdminSettings } from '../../types/api'

// Mutable state so PATCH updates are reflected in subsequent GET calls
let currentSettings: AdminSettings = { ...settingsFixture }

export const settingsHandlers = [
  http.get('/api/settings', () => HttpResponse.json(currentSettings)),
  http.patch('/api/settings', async ({ request }) => {
    const body = await request.json()
    currentSettings = { ...currentSettings, ...(body as object) }
    return HttpResponse.json(currentSettings)
  }),
]
