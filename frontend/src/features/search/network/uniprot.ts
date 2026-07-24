/**
 * Strip a UniProt isoform suffix so structure lookups resolve.
 *
 * Isoform accessions like `Q07817-1` are not indexed as standalone records in
 * the AlphaFold DB (nor, reliably, as RCSB uniprot_ids) — only the canonical
 * accession `Q07817` resolves. `-1` is the canonical sequence and the rest are
 * isoforms; in all cases the base accession is what these services key on.
 */
export function baseAccession(uniprotId: string): string {
  return uniprotId.replace(/-\d+$/, '')
}
