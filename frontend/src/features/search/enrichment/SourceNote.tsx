import type { EnrichmentSource } from '../../../api/enrichment'

/**
 * Small attribution footer shown under data tabs whose source is not obvious
 * (tissue expression, subcellular location, functional enrichment). Resource
 * names link to the resource homepage (stable), with the primary citation as
 * plain text.
 */
export function SourceNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--border)',
        fontSize: 11,
        color: 'var(--text-soft)',
        lineHeight: 1.5,
        background: 'var(--bg)',
      }}
    >
      {children}
    </div>
  )
}

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
      {children}
    </a>
  )
}

export function HpaSourceNote({ assay }: { assay: 'tissue' | 'subcellular' }) {
  const citation =
    assay === 'tissue' ? 'Uhlén et al., Science 2015' : 'Thul et al., Science 2017'
  return (
    <SourceNote>
      Data source: <Ext href="https://www.proteinatlas.org">Human Protein Atlas</Ext> ({citation}).
    </SourceNote>
  )
}

interface SourceInfo {
  name: string
  href: string
  citation: string
}

const ENRICHMENT_SOURCE_INFO: Record<EnrichmentSource, SourceInfo> = {
  'GO:MF': { name: 'Gene Ontology', href: 'http://geneontology.org', citation: 'Gene Ontology Consortium' },
  'GO:BP': { name: 'Gene Ontology', href: 'http://geneontology.org', citation: 'Gene Ontology Consortium' },
  'GO:CC': { name: 'Gene Ontology', href: 'http://geneontology.org', citation: 'Gene Ontology Consortium' },
  REAC: { name: 'Reactome', href: 'https://reactome.org', citation: 'Gillespie et al., NAR 2022' },
  CORUM: { name: 'CORUM', href: 'https://mips.helmholtz-muenchen.de/corum/', citation: 'Giurgiu et al., NAR 2019' },
  KEGG: { name: 'KEGG', href: 'https://www.genome.jp/kegg/', citation: 'Kanehisa & Goto, NAR 2000' },
}

export function EnrichmentSourceNote({ source }: { source: EnrichmentSource }) {
  const info = ENRICHMENT_SOURCE_INFO[source]
  return (
    <SourceNote>
      Enrichment computed with{' '}
      <Ext href="https://biit.cs.ut.ee/gprofiler">g:Profiler</Ext> (Raudvere et al., NAR 2019) over{' '}
      <Ext href={info.href}>{info.name}</Ext> ({info.citation}).
    </SourceNote>
  )
}
