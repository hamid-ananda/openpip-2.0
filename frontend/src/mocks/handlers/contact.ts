import { http, HttpResponse } from 'msw'

export const contactHandlers = [
  http.post('/api/contact', () =>
    HttpResponse.json({ detail: 'Message sent successfully.' }, { status: 200 })
  ),
]
