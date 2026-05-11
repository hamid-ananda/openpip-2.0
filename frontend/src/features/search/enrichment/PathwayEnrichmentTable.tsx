import { usePathwayEnrichment } from '../../../api/enrichment'

interface PathwayEnrichmentTableProps {
  geneNames: string[]
}

export function PathwayEnrichmentTable({ geneNames }: PathwayEnrichmentTableProps) {
  const { data, isLoading, isError } = usePathwayEnrichment(geneNames)

  if (isLoading) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">
        Running pathway enrichment analysis...
      </p>
    )
  }

  if (isError) {
    return (
      <p className="py-6 text-center text-sm text-red-600">
        Failed to fetch pathway enrichment. External service may be unavailable.
      </p>
    )
  }

  const pathways = data ?? []

  if (pathways.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">
        No significant pathways found (p &lt; 0.05)
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Pathway ID</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">p-value</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Found/Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {pathways.map((pathway) => (
            <tr key={pathway.stId} className="hover:bg-gray-50">
              <td className="px-4 py-2">
                <a
                  href={`https://reactome.org/content/detail/${pathway.stId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {pathway.stId}
                </a>
              </td>
              <td className="px-4 py-2 text-gray-800">{pathway.name}</td>
              <td className="px-4 py-2 tabular-nums text-gray-700">
                {pathway.pValue.toExponential(2)}
              </td>
              <td className="px-4 py-2 tabular-nums text-gray-700">
                {pathway.entities_found}/{pathway.entities_total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
