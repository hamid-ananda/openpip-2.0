import type { Protein } from '../../types/api'

export interface ExternalLink {
  id: string
  label: string
  href?: string
  onClick?: () => void
}

export function buildLinks(allProteins: Protein[], queryProteinIds: number[]): ExternalLink[] {
  const genes = allProteins.map((p) => p.protein_gene_name)
  const queryGenes = allProteins
    .filter((p) => queryProteinIds.includes(p.protein_id))
    .map((p) => p.protein_gene_name)
  const entrezIds = allProteins.map((p) => p.protein_entrez_id).filter(Boolean)

  const gProfilerUrl =
    'https://biit.cs.ut.ee/gprofiler/index.cgi?organism=hsapiens&query=' +
    genes.map((g) => encodeURIComponent(g)).join('+')

  const geneManiaUrl =
    'http://genemania.org/search/human/' + genes.map((g) => encodeURIComponent(g)).join('%7C')

  const pathwayCommonsUrl =
    'http://www.pathwaycommons.org/pcviz/#pathsbetween/' + genes.join(',')

  const davidUrl =
    'http://david.abcc.ncifcrf.gov/api.jsp?type=ENTREZ_GENE_ID&ids=' +
    entrezIds.join(',') +
    '&tool=summary'

  const stringUrl =
    'http://string-db.org/newstring_cgi/show_network_section.pl?identifiers=' +
    genes.map((g) => encodeURIComponent(g)).join('%0D') +
    '&species=9606'

  const cBioPortalUrl =
    'http://www.cbioportal.org/ln?q=' + genes.map((g) => encodeURIComponent(g)).join('+')

  const complexPortalUrl =
    'http://www.ebi.ac.uk/complexportal/complex/search?query=' +
    genes.map((g) => encodeURIComponent(g)).join('+')

  const intActUrl =
    'http://www.ebi.ac.uk/intact/query/' +
    queryGenes.map((g) => encodeURIComponent(g)).join('+')

  async function openReactome() {
    try {
      const body = '#Genes\n' + genes.join('\n')
      const res = await fetch('https://reactome.org/AnalysisService/identifiers/', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body,
      })
      const data = await res.json()
      const token = data?.summary?.token
      if (token) {
        window.open(
          `https://reactome.org/PathwayBrowser/#DTAB=AN&ANALYSIS=${token}`,
          '_blank',
          'noopener,noreferrer'
        )
      } else {
        window.open('https://reactome.org', '_blank', 'noopener,noreferrer')
      }
    } catch {
      window.open('https://reactome.org', '_blank', 'noopener,noreferrer')
    }
  }

  return [
    { id: 'gprofiler', label: 'gProfiler', href: gProfilerUrl },
    { id: 'reactome', label: 'Reactome', onClick: openReactome },
    { id: 'genemania', label: 'GeneMania', href: geneManiaUrl },
    { id: 'pathwaycommons', label: 'Pathway Commons', href: pathwayCommonsUrl },
    { id: 'david', label: 'DAVID', href: davidUrl },
    { id: 'string', label: 'STRING', href: stringUrl },
    { id: 'cbioportal', label: 'cBioPortal', href: cBioPortalUrl },
    { id: 'complexportal', label: 'Complex Portal', href: complexPortalUrl },
    { id: 'intact', label: 'IntAct (Query)', href: intActUrl },
  ]
}
