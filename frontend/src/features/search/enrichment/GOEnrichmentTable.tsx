import { useGOEnrichment } from '../../../api/enrichment'

interface GOEnrichmentTableProps {
  geneNames: string[]
}

const SOURCE_BADGE: Record<string, string> = {
  'GO:BP': 'bg-green-100 text-green-800',
  'GO:MF': 'bg-blue-100 text-blue-800',
  'GO:CC': 'bg-purple-100 text-purple-800',
}

export function GOEnrichmentTable({ geneNames }: GOEnrichmentTableProps) {
  const { data, isLoading, isError } = useGOEnrichment(geneNames)

  if (isLoading) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">
        Running GO enrichment analysis...
      </p>
    )
  }

  if (isError) {
    return (
      <p className="py-6 text-center text-sm text-red-600">
        Failed to fetch GO enrichment. External service may be unavailable.
      </p>
    )
  }

  const sorted = (data ?? [])
    .slice()
    .sort((a, b) => a.p_value - b.p_value)
    .slice(0, 50)

  if (sorted.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">
        No significant GO terms found (p &lt; 0.05)
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Term ID</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Source</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">p-value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((term) => (
            <tr key={term.term_id} className="hover:bg-gray-50">
              <td className="px-4 py-2">
                <a
                  href={`https://www.ebi.ac.uk/QuickGO/term/${term.term_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {term.term_id}
                </a>
              </td>
              <td className="px-4 py-2 text-gray-800">{term.name}</td>
              <td className="px-4 py-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_BADGE[term.source] ?? 'bg-gray-100 text-gray-800'}`}
                >
                  {term.source}
                </span>
              </td>
              <td className="px-4 py-2 tabular-nums text-gray-700">
                {term.p_value.toExponential(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
