import { http, HttpResponse } from 'msw'

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { username: string; password: string }
    if (body.username === 'admin' && body.password === 'admin') {
      return HttpResponse.json({ access: 'mock-access-token', refresh: 'mock-refresh-token', is_admin: true })
    }
    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
  }),
  http.post('/api/auth/logout', () => HttpResponse.json({ detail: 'Logged out' })),
  http.post('/api/auth/token/refresh', () =>
    HttpResponse.json({ access: 'mock-access-token', refresh: 'mock-refresh-token' })
  ),

  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as { username: string; email: string; password: string }
    if (!body.username || !body.email || !body.password) {
      return HttpResponse.json({ detail: 'All fields required' }, { status: 400 })
    }
    return HttpResponse.json({ detail: 'Registration successful' }, { status: 201 })
  }),

  http.get('/api/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth) return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 })
    return HttpResponse.json({ username: 'admin', email: 'admin@example.com', is_admin: true })
  }),
]
