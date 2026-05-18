import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProtein } from '../../api/proteins'

function fastaFormat(geneName: string, uniprotId: string, sequence: string): string {
  const header = `>${geneName || uniprotId}|${uniprotId}`
  const wrapped = sequence.match(/.{1,60}/g)?.join('\n') ?? sequence
  return `${header}\n${wrapped}`
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

function IdBadge({ label, value, href }: { label: string; value: string; href?: string }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {label}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontFamily: 'var(--mono)' }}
        >
          {value}
        </a>
      ) : (
        <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{value}</span>
      )}
    </div>
  )
}

export function ProteinDetailPage() {
  const { identifier = '' } = useParams<{ identifier: string }>()
  const navigate = useNavigate()
  const { data: protein, isLoading, isError } = useProtein(identifier)

  if (isLoading) {
    return (
      <div style={{ padding: '64px 48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading protein…
      </div>
    )
  }

  if (isError || !protein) {
    return (
      <div style={{ padding: '64px 48px', textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>Protein not found</div>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
          No protein matched <strong>{identifier}</strong>.
        </p>
        <button className="op-btn" onClick={() => navigate(-1)}>← Go back</button>
      </div>
    )
  }

  const fasta = protein.protein_sequence
    ? fastaFormat(protein.protein_gene_name, protein.protein_uniprot_id, protein.protein_sequence)
    : null

  const annotationEntries = Object.entries(protein.annotation_array).filter(
    ([, vals]) => vals.length > 0
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
        {' / '}
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', padding: 0 }}
        >
          Search
        </button>
        {' / '}
        <span style={{ color: 'var(--text)' }}>{protein.protein_gene_name || identifier}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)', margin: '0 0 6px' }}>
          {protein.protein_gene_name || protein.protein_uniprot_id}
        </h1>
        {protein.protein_protein_name && (
          <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>{protein.protein_protein_name}</p>
        )}
      </div>

      {/* Identifiers card */}
      <div className="op-card" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>
          Identifiers
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px 24px' }}>
          <IdBadge label="Gene name" value={protein.protein_gene_name} />
          <IdBadge
            label="UniProt"
            value={protein.protein_uniprot_id}
            href={protein.protein_uniprot_id ? `https://www.uniprot.org/uniprot/${protein.protein_uniprot_id}` : undefined}
          />
          <IdBadge
            label="Ensembl"
            value={protein.protein_ensembl_id}
            href={protein.protein_ensembl_id ? `https://www.ensembl.org/id/${protein.protein_ensembl_id}` : undefined}
          />
          <IdBadge label="Entrez" value={protein.protein_entrez_id} />
          <IdBadge label="Interactions" value={String(protein.number_of_interactions_in_database)} />
        </div>
      </div>

      {/* Description */}
      {protein.protein_description && (
        <div className="op-card" style={{ padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
            Description
          </div>
          <p style={{ fontSize: 14, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
            {protein.protein_description}
          </p>
        </div>
      )}

      {/* FASTA sequence */}
      {fasta && (
        <div className="op-card" style={{ padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Sequence ({protein.protein_sequence.length} aa)
            </div>
            <button
              className="op-btn"
              style={{ padding: '4px 12px', fontSize: 12 }}
              onClick={() => copyToClipboard(fasta)}
            >
              Copy FASTA
            </button>
          </div>
          <pre
            style={{
              fontSize: 12,
              fontFamily: 'var(--mono)',
              color: 'var(--text)',
              background: 'var(--surface-2, var(--bg))',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '12px 14px',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {fasta}
          </pre>
        </div>
      )}

      {/* Annotations */}
      {annotationEntries.length > 0 && (
        <div className="op-card" style={{ padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
            Annotations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {annotationEntries.map(([type, values]) => (
              <div key={type}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{type}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {values.slice(0, 20).map((v, i) => (
                    <span key={i} className="op-chip" style={{ fontSize: 11 }}>{v}</span>
                  ))}
                  {values.length > 20 && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{values.length - 20} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External links */}
      <div className="op-card" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
          External resources
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {protein.protein_uniprot_id && (
            <a href={`https://www.uniprot.org/uniprot/${protein.protein_uniprot_id}`} target="_blank" rel="noreferrer" className="op-btn" style={{ fontSize: 13, padding: '6px 14px' }}>
              UniProt ↗
            </a>
          )}
          {protein.protein_gene_name && (
            <a href={`https://string-db.org/network/${protein.protein_gene_name}`} target="_blank" rel="noreferrer" className="op-btn" style={{ fontSize: 13, padding: '6px 14px' }}>
              STRING ↗
            </a>
          )}
          {protein.protein_gene_name && (
            <a href={`https://www.genecards.org/cgi-bin/carddisp.pl?gene=${protein.protein_gene_name}`} target="_blank" rel="noreferrer" className="op-btn" style={{ fontSize: 13, padding: '6px 14px' }}>
              GeneCards ↗
            </a>
          )}
          {protein.protein_ensembl_id && (
            <a href={`https://www.ensembl.org/id/${protein.protein_ensembl_id}`} target="_blank" rel="noreferrer" className="op-btn" style={{ fontSize: 13, padding: '6px 14px' }}>
              Ensembl ↗
            </a>
          )}
          <Link
            to={`/search/${encodeURIComponent(protein.protein_gene_name || identifier)}`}
            className="op-btn primary"
            style={{ fontSize: 13, padding: '6px 14px' }}
          >
            Search interactions →
          </Link>
        </div>
      </div>
    </div>
  )
}
