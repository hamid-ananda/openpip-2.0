import { EnrichmentTable } from './EnrichmentTable'

interface PathwayEnrichmentTableProps {
  geneNames: string[]
}

export function PathwayEnrichmentTable({ geneNames }: PathwayEnrichmentTableProps) {
  return <EnrichmentTable geneNames={geneNames} source="REAC" />
}
