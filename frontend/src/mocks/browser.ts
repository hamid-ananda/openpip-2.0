import { setupWorker } from 'msw/browser'
import { http, passthrough } from 'msw'

// In the browser (dev mode) every request passes through to the real backend.
// Fixtures are only used in vitest (server.ts) where there is no live API.
const passthroughHandlers = [
  http.all('*', () => passthrough()),
]

export const worker = setupWorker(...passthroughHandlers)
