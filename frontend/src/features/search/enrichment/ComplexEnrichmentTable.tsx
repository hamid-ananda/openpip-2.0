import { Info } from 'lucide-react'
import { useCORUMEnrichment } from '../../../api/enrichment'

interface ComplexEnrichmentTableProps {
  geneNames: string[]
}

export function ComplexEnrichmentTable({ geneNames }: ComplexEnrichmentTableProps) {
  // Hook is called to stay consistent with the data-fetching pattern,
  // but Phase 1 always returns an empty array.
  useCORUMEnrichment(geneNames)

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-6 py-8 text-center">
      <Info className="mx-auto mb-3 h-6 w-6 text-gray-400" aria-hidden="true" />
      <p className="text-sm text-gray-600">
        Protein complex enrichment analysis requires server-side processing (available in Phase 2).
      </p>
    </div>
  )
}
