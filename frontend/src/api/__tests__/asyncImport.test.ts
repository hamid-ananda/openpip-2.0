import { describe, it, expect, vi, beforeEach } from 'vitest'
import { startAsyncImport, pollImportStatus } from '../asyncImport'

const { mockPost, mockGet } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
}))
vi.mock('../client', () => ({ apiClient: { post: mockPost, get: mockGet } }))

describe('startAsyncImport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts to /datasets/import-async with a FormData body', async () => {
    mockPost.mockResolvedValue({ data: { task_id: 'abc-123' } })
    const file = new File(['line1\tline2'], 'test.tab', { type: 'text/plain' })
    await startAsyncImport(file, { dataset_name: 'TestDS', interaction_status: 'published', category_id: '' })
    expect(mockPost).toHaveBeenCalledWith('/datasets/import-async', expect.any(FormData))
  })

  it('returns the task_id from the response', async () => {
    mockPost.mockResolvedValue({ data: { task_id: 'task-xyz' } })
    const file = new File(['data'], 'test.tab')
    const id = await startAsyncImport(file, { dataset_name: 'DS', interaction_status: 'published', category_id: '' })
    expect(id).toBe('task-xyz')
  })

  it('appends category_id to form when provided', async () => {
    mockPost.mockResolvedValue({ data: { task_id: 't1' } })
    const file = new File(['data'], 'test.tab')
    await startAsyncImport(file, { dataset_name: 'DS', interaction_status: 'published', category_id: '3' })
    const form = mockPost.mock.calls[0][1] as FormData
    expect(form.get('category_id')).toBe('3')
  })

  it('omits category_id from form when empty string', async () => {
    mockPost.mockResolvedValue({ data: { task_id: 't1' } })
    const file = new File(['data'], 'test.tab')
    await startAsyncImport(file, { dataset_name: 'DS', interaction_status: 'published', category_id: '' })
    const form = mockPost.mock.calls[0][1] as FormData
    expect(form.get('category_id')).toBeNull()
  })
})

describe('pollImportStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GETs the correct task status URL', async () => {
    mockGet.mockResolvedValue({
      data: { task_id: 'abc', status: 'PROGRESS', progress: 50,
              proteins_created: 0, interactions_created: 0, interactions_skipped: 0, errors: [] },
    })
    await pollImportStatus('abc-123')
    expect(mockGet).toHaveBeenCalledWith('/datasets/import-async/abc-123')
  })

  it('returns the full status object', async () => {
    const payload = {
      task_id: 'abc', status: 'SUCCESS', progress: 100,
      proteins_created: 5, interactions_created: 20, interactions_skipped: 1, errors: [],
    }
    mockGet.mockResolvedValue({ data: payload })
    const result = await pollImportStatus('abc')
    expect(result).toEqual(payload)
  })
})
