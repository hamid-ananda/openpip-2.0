import { http, HttpResponse } from 'msw'
import type { InteractionCategory, DatasetPreviewResult } from '../../api/datasets'

const categoriesFixture: InteractionCategory[] = [
  { id: 1, category_name: 'HI-Union', order: '3' },
  { id: 2, category_name: 'Published', order: '1' },
  { id: 3, category_name: 'Validated', order: '2' },
]

const previewFixture: DatasetPreviewResult = {
  dry_run: true,
  proteins_created: 10,
  proteins_existing: 5,
  interactions_created: 20,
  interactions_skipped: 2,
  errors: [],
}

const uploadFixture: DatasetPreviewResult = {
  dry_run: false,
  proteins_created: 10,
  proteins_existing: 5,
  interactions_created: 20,
  interactions_skipped: 2,
  errors: [],
}

export const datasetHandlers = [
  http.get('/api/interactions/categories', () => HttpResponse.json(categoriesFixture)),
  http.post('/api/datasets/preview', () => HttpResponse.json(previewFixture)),
  http.post('/api/datasets/upload', () => HttpResponse.json(uploadFixture, { status: 201 })),
]
