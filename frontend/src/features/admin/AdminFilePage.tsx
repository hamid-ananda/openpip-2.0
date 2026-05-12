function FileTypeCard({
  ext,
  desc,
  icon,
}: {
  ext: string
  desc: string
  icon: React.ReactNode
}) {
  return (
    <div className="op-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'var(--surface-2)',
            color: 'var(--text-muted)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {icon}
        </div>
        <span className="op-num" style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
          {ext}
        </span>
        <span className="op-chip" style={{ fontSize: 10 }}>Phase 2</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
        {desc}
      </p>
    </div>
  )
}

export function AdminFilePage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: '40px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '-.02em',
            margin: '0 0 6px',
            color: 'var(--text)',
          }}
        >
          File Manager
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px' }}>
          Upload and manage supplementary files served alongside interaction data.
        </p>

        {/* Phase 2 notice */}
        <div
          className="op-card"
          style={{
            padding: 20,
            borderLeft: '3px solid var(--warn)',
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start',
            marginBottom: 32,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--warn)"
            strokeWidth="2"
            style={{ flexShrink: 0, marginTop: 2 }}
            aria-hidden
          >
            <path d="M12 9v4m0 4h.01M10.3 3.86l-8.6 14.91A2 2 0 0 0 3.4 22h17.2a2 2 0 0 0 1.7-3.23L13.7 3.86a2 2 0 0 0-3.4 0Z" />
          </svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>
              File upload is a Phase 2 feature
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              The file manager — including FASTA upload, sequence file browsing, and delete operations — is
              scheduled for Phase 2 of the migration. Currently, files can be managed directly on the server.
            </p>
          </div>
        </div>

        {/* File types explained */}
        <h3
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            margin: '0 0 14px',
          }}
        >
          Supported file types (Phase 2)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <FileTypeCard
            ext=".fasta"
            desc="Protein sequence files in FASTA format. Linked to datasets for sequence-level analysis and export."
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            }
          />
          <FileTypeCard
            ext=".tab / .tsv"
            desc="PSI-MI TAB interaction files. These are the primary data format for uploading via the Data Manager."
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            }
          />
          <FileTypeCard
            ext=".sif"
            desc="Simple Interaction Format files for Cytoscape desktop import and network exchange."
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="4" />
                <line x1="4" y1="8" x2="12" y2="12" />
                <line x1="20" y1="8" x2="12" y2="12" />
                <circle cx="4" cy="8" r="2" />
                <circle cx="20" cy="8" r="2" />
              </svg>
            }
          />
          <FileTypeCard
            ext=".csv"
            desc="Comma-separated values export for use in spreadsheet tools and statistical software."
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  )
}
