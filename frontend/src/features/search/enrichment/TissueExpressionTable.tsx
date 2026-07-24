import type { Protein } from '../../../types/api'
import { HpaSourceNote } from './SourceNote'

interface TissueExpressionTableProps {
  proteins: Protein[]
}

const THRESHOLD = 5.0

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

export function TissueExpressionTable({ proteins }: TissueExpressionTableProps) {
  // Group proteins by tissue; apply legacy threshold >= 5.0; strip \r from stored values
  const byTissue: Record<string, string[]> = {}
  for (const p of proteins) {
    const tissue = p.tissue_expression_array as Record<string, string>
    for (const [name, rawLevel] of Object.entries(tissue)) {
      const level = parseFloat(rawLevel?.replace?.('\r', '') ?? '')
      if (!isNaN(level) && level >= THRESHOLD) {
        byTissue[name] ??= []
        byTissue[name].push(p.protein_gene_name)
      }
    }
  }

  const tissues = Object.keys(byTissue).sort()

  if (tissues.length === 0) {
    return (
      <p style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        No tissue expression data available for these proteins.
      </p>
    )
  }

  return (
    <div style={{ overflowX: 'auto', background: 'var(--bg)' }}>
      <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: 13, background: 'var(--bg)' }}>
        <thead>
          <tr>
            <th style={TH}>Tissue</th>
            <th style={TH}>Proteins</th>
          </tr>
        </thead>
        <tbody style={{ background: 'var(--bg)' }}>
          {tissues.map((tissue) => (
            <tr
              key={tissue}
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              <td style={{ padding: '8px 16px', color: 'var(--text)', textTransform: 'capitalize' }}>
                {tissue.replace(/_/g, ' ')}
              </td>
              <td style={{ padding: '8px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                {byTissue[tissue].join(' | ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <HpaSourceNote assay="tissue" />
    </div>
  )
}
