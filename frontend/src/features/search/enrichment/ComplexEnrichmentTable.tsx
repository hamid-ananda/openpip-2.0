import { EnrichmentTable } from './EnrichmentTable'

interface ComplexEnrichmentTableProps {
  geneNames: string[]
}

export function ComplexEnrichmentTable({ geneNames }: ComplexEnrichmentTableProps) {
  return <EnrichmentTable geneNames={geneNames} source="CORUM" />
}
