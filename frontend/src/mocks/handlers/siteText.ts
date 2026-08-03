import { http, HttpResponse } from 'msw'
import type { SiteTextEntry } from '../../types/api'

// Stateful so PUT writes are reflected in GET within the same test run.
// Starts empty: with no overrides, pages render their shipped defaults.
let currentText: Record<string, string> = {}

/** Lets a test seed overrides without going through the API. */
export function seedSiteText(text: Record<string, string>) {
  currentText = { ...text }
}

export function resetSiteText() {
  currentText = {}
}

export const siteTextHandlers = [
  http.get('/api/settings/text', () => HttpResponse.json({ locale: 'en', text: currentText })),
  http.put('/api/settings/text', async ({ request }) => {
    const body = (await request.json()) as { entries?: SiteTextEntry[] }
    for (const entry of body.entries ?? []) {
      if (entry.value === null || entry.value === undefined) {
        delete currentText[entry.key]
      } else {
        currentText[entry.key] = entry.value
      }
    }
    return HttpResponse.json({ locale: 'en', text: currentText })
  }),
]
