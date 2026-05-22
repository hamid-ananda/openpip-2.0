import { EnrichmentTable } from './EnrichmentTable'

interface GOEnrichmentTableProps {
  geneNames: string[]
  source?: 'GO:BP' | 'GO:MF' | 'GO:CC'
}

export function GOEnrichmentTable({ geneNames, source = 'GO:MF' }: GOEnrichmentTableProps) {
  return <EnrichmentTable geneNames={geneNames} source={source} />
}
