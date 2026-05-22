import { apiClient } from './client'

export interface AsyncImportStatus {
  task_id: string
  status: string
  progress: number
  proteins_created: number
  interactions_created: number
  interactions_skipped: number
  errors: { row: number; reason: string }[]
}

export async function startAsyncImport(
  file: File,
  meta: { dataset_name: string; interaction_status: string; category_id: string },
): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('dataset_name', meta.dataset_name)
  form.append('interaction_status', meta.interaction_status)
  if (meta.category_id) form.append('category_id', meta.category_id)
  const res = await apiClient.post<{ task_id: string }>('/datasets/import-async', form)
  return res.data.task_id
}

export async function pollImportStatus(taskId: string): Promise<AsyncImportStatus> {
  const res = await apiClient.get<AsyncImportStatus>(`/datasets/import-async/${taskId}`)
  return res.data
}
