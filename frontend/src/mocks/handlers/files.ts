import { http, HttpResponse } from 'msw'

export interface MockFile {
  id: number
  file_name: string
  file_size: number
  show: boolean
  uploaded_at: string
}

let nextId = 1
let files: MockFile[] = []

export function resetFiles() {
  files = []
  nextId = 1
}

export const filesHandlers = [
  http.get('/api/files', () => HttpResponse.json(files)),

  http.post('/api/files', async ({ request }) => {
    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) return HttpResponse.json({ detail: 'No file provided.' }, { status: 400 })
    const allowed = ['.fasta', '.fa', '.tab', '.tsv', '.sif', '.csv']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowed.includes(ext))
      return HttpResponse.json({ detail: `File type '${ext}' not allowed.` }, { status: 400 })
    const existing = files.find((f) => f.file_name === file.name)
    const force = form.get('force') === 'true'
    if (existing && !force)
      return HttpResponse.json({ detail: 'collision', file_name: file.name }, { status: 409 })
    const record: MockFile = {
      id: nextId++,
      file_name: file.name,
      file_size: file.size,
      show: true,
      uploaded_at: new Date().toISOString(),
    }
    files.push(record)
    return HttpResponse.json(record, { status: 201 })
  }),

  http.patch('/api/files/:pk', async ({ params, request }) => {
    const id = Number(params.pk)
    const body = (await request.json()) as { show?: boolean }
    const record = files.find((f) => f.id === id)
    if (!record) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    if (body.show !== undefined) record.show = body.show
    return HttpResponse.json(record)
  }),

  http.delete('/api/files/:pk', ({ params }) => {
    const id = Number(params.pk)
    const idx = files.findIndex((f) => f.id === id)
    if (idx === -1) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    files.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/files/:pk/download', ({ params }) => {
    const id = Number(params.pk)
    const record = files.find((f) => f.id === id)
    if (!record) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    return new HttpResponse('col1\tcol2\nA\tB\n', {
      headers: { 'Content-Type': 'application/octet-stream' },
    })
  }),

  http.get('/api/files/public', () =>
    HttpResponse.json(files.filter((f) => f.show))
  ),
]
