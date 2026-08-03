/**
 * The interaction filter attached to a homepage/sidebar search example.
 *
 * The admin_settings columns are free-text, and legacy rows spell the
 * "no filter" case as "all" (or leave it null). Everywhere else in the UI
 * that filter is called "None", so normalise to that name.
 */
export type ExampleType = 'None' | 'query-query' | 'query-interactor'

export const EXAMPLE_TYPES: ExampleType[] = ['None', 'query-query', 'query-interactor']

export function normalizeExampleType(type: string | undefined | null): ExampleType {
  if (type === 'query-query') return 'query-query'
  if (type === 'query-interactor') return 'query-interactor'
  return 'None'
}

export function toFilterMode(
  type: string | undefined | null,
): 'None' | 'query_query' | 'query_interactor' {
  const normalized = normalizeExampleType(type)
  if (normalized === 'None') return 'None'
  return normalized === 'query-query' ? 'query_query' : 'query_interactor'
}
