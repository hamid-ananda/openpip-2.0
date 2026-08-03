import { Navigate, useParams } from 'react-router-dom'

/**
 * `/protein/:identifier` was the standalone protein page before the browsable
 * catalogue replaced it. Bookmarks and older links still point here.
 */
export function LegacyProteinRedirect() {
  const { identifier = '' } = useParams<{ identifier: string }>()
  const target = identifier ? `/proteins/${encodeURIComponent(identifier)}` : '/proteins'
  return <Navigate to={target} replace />
}
