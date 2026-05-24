import { useEnrichment, type EnrichmentSource } from '../../../api/enrichment'

interface EnrichmentTableProps {
  geneNames: string[]
  source: EnrichmentSource
}

const TH: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '.07em',
  color: 'var(--text-muted)',
  background: 'var(--surface-2)',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

function termUrl(term_id: string, source: EnrichmentSource): string {
  if (source.startsWith('GO:')) return `https://amigo.geneontology.org/amigo/term/${term_id}`
  if (source === 'REAC') return `https://reactome.org/content/detail/${term_id}`
  if (source === 'CORUM') {
    const id = term_id.replace(/^CORUM:/, '')
    return `http://mips.helmholtz-muenchen.de/corum/?id=${id}`
  }
  if (source === 'KEGG') {
    const id = term_id.replace(/^KEGG:/, '')
    return `https://www.genome.jp/kegg-bin/show_pathway?map=${id}`
  }
  return '#'
}

export function EnrichmentTable({ geneNames, source }: EnrichmentTableProps) {
  const { data, isLoading, isError } = useEnrichment(geneNames)

  if (isLoading) {
    return (
      <p style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        Running enrichment analysis...
      </p>
    )
  }

  if (isError) {
    return (
      <p style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'var(--danger)' }}>
        Failed to fetch enrichment results. External service may be unavailable.
      </p>
    )
  }

  const rows = (data ?? [])
    .filter((t) => t.source === source)
    .sort((a, b) => a.p_value - b.p_value)
    .slice(0, 50)

  if (rows.length === 0) {
    return (
      <p style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        No significant terms found (p &lt; 0.05)
      </p>
    )
  }

  return (
    <div style={{ overflowX: 'auto', background: 'var(--bg)' }}>
      <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: 13, background: 'var(--bg)' }}>
        <thead>
          <tr>
            <th style={TH}>Term ID</th>
            <th style={TH}>Name</th>
            <th style={TH}>p-value</th>
          </tr>
        </thead>
        <tbody style={{ background: 'var(--bg)' }}>
          {rows.map((term) => (
            <tr
              key={term.term_id}
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              <td style={{ padding: '8px 16px' }}>
                <a
                  href={termUrl(term.term_id, source)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)' }}
                >
                  {term.term_id}
                </a>
              </td>
              <td style={{ padding: '8px 16px', color: 'var(--text)' }}>{term.name}</td>
              <td style={{ padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                {term.p_value.toExponential(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
