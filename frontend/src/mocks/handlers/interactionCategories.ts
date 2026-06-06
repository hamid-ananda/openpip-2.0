import { http, HttpResponse } from 'msw'
import { interactionCategoriesFixture } from '../fixtures/interactionCategories'
import type { InteractionCategory } from '../../types/api'

let categories: InteractionCategory[] = interactionCategoriesFixture.map((c) => ({ ...c }))
let nextId = 10

export const interactionCategoryHandlers = [
  http.get('/api/interaction-categories', () => HttpResponse.json(categories)),

  http.post('/api/interaction-categories', async ({ request }) => {
    const body = (await request.json()) as Omit<InteractionCategory, 'id'>
    const created: InteractionCategory = { id: nextId++, ...body }
    categories = [...categories, created]
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch('/api/interaction-categories/:id', async ({ request, params }) => {
    const id = Number(params.id)
    const body = (await request.json()) as Partial<InteractionCategory>
    categories = categories.map((c) => (c.id === id ? { ...c, ...body } : c))
    const updated = categories.find((c) => c.id === id)
    if (!updated) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    return HttpResponse.json(updated)
  }),

  http.delete('/api/interaction-categories/:id', ({ params }) => {
    const id = Number(params.id)
    categories = categories.filter((c) => c.id !== id)
    return new HttpResponse(null, { status: 204 })
  }),
]
