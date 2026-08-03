import { http, HttpResponse } from 'msw'

/** Mutable so a granted promotion sticks for the rest of the dev session. */
const mockUsers = [
  { id: 1, username: 'admin', email: 'admin@example.com', isAdmin: true, isSuperuser: true, dateJoined: '2026-01-04T09:00:00Z' },
  { id: 2, username: 'rlomax', email: 'r.lomax@example.edu', isAdmin: true, isSuperuser: false, dateJoined: '2026-02-11T14:20:00Z' },
  { id: 3, username: 'jchen', email: 'j.chen@example.edu', isAdmin: false, isSuperuser: false, dateJoined: '2026-03-02T08:45:00Z' },
]

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

  // Admin-only. Promotion is the only route to a new admin: /api/auth/register
  // is public and deliberately never sets the staff flag.
  http.get('/api/admin/users', ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 })
    }
    const search = new URL(request.url).searchParams.get('search')?.toLowerCase() ?? ''
    const matches = mockUsers.filter(
      (u) => u.username.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
    )
    return HttpResponse.json(matches)
  }),

  http.patch('/api/admin/users/:id', async ({ request, params }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 })
    }
    const user = mockUsers.find((u) => u.id === Number(params.id))
    if (!user) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })

    const body = (await request.json()) as { isAdmin?: boolean }
    if (typeof body.isAdmin !== 'boolean') {
      return HttpResponse.json({ isAdmin: 'Expected true or false.' }, { status: 400 })
    }
    if (!body.isAdmin && user.isSuperuser) {
      return HttpResponse.json(
        { isAdmin: 'Superusers cannot have their admin access revoked.' },
        { status: 400 }
      )
    }
    user.isAdmin = body.isAdmin
    return HttpResponse.json(user)
  }),

  http.get('/api/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth) return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 })
    return HttpResponse.json({ username: 'admin', email: 'admin@example.com', is_admin: true })
  }),
]
