/** Build an NCBI Gene URL for a gene. Prefers a direct Entrez Gene record when
 * the numeric ID is known; otherwise falls back to an NCBI Gene symbol search. */
export function ncbiGeneUrl(entrezId: string | undefined, symbol: string): string {
  if (entrezId && entrezId.trim()) {
    return `https://www.ncbi.nlm.nih.gov/gene/${entrezId.trim()}`
  }
  return `https://www.ncbi.nlm.nih.gov/gene/?term=${encodeURIComponent(symbol)}%5Bsym%5D`
}
