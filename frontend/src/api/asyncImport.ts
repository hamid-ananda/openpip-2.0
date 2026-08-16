import { apiClient } from './client'

export interface AsyncImportStatus {
  task_id: string
  status: string
  stage:
    | 'parsing'
    | 'enriching_uniprot'
    | 'enriching_uniprot_warn'
    | 'enriching_ensembl'
    | 'enriching_ensembl_warn'
    | 'enriching_organisms'
    | 'enriching_organisms_warn'
    | 'done'
    | null
  progress: number
  proteins_created: number
  interactions_created: number
  interactions_skipped: number
  errors: { row: number; reason: string }[]
}

export interface AsyncImportMeta {
  dataset_name: string
  interaction_status: string
  category_id: string
  /** Optional citation / About copy captured in the wizard's metadata step. */
  pubmed_id?: string
  doi?: string
  author?: string
  year?: string
  title?: string
  journal?: string
  publication_status?: string
  about_body?: string
}

const OPTIONAL_META_KEYS = [
  'pubmed_id',
  'doi',
  'author',
  'year',
  'title',
  'journal',
  'publication_status',
  'about_body',
] as const

export async function startAsyncImport(file: File, meta: AsyncImportMeta): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('dataset_name', meta.dataset_name)
  form.append('interaction_status', meta.interaction_status)
  if (meta.category_id) form.append('category_id', meta.category_id)
  // Only send what was filled in — an empty value would clear the field rather
  // than leave it untouched.
  for (const key of OPTIONAL_META_KEYS) {
    const value = meta[key]
    if (value) form.append(key, value)
  }
  const res = await apiClient.post<{ task_id: string }>('/datasets/import-async', form)
  return res.data.task_id
}

export async function pollImportStatus(taskId: string): Promise<AsyncImportStatus> {
  const res = await apiClient.get<AsyncImportStatus>(`/datasets/import-async/${taskId}`)
  return res.data
}
