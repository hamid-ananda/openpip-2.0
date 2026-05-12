import { useCounts } from '../../api/counts'
import { useDatasets } from '../../api/downloads'

function StatCard({ value, label, icon }: { value: string | number; label: string; icon: React.ReactNode }) {
  return (
    <div
      className="op-card"
      style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: 'var(--primary-soft)',
          color: 'var(--primary)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          className="op-num"
          style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--text)' }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{label}</div>
      </div>
    </div>
  )
}

function Phase2Banner({ title, description }: { title: string; description: string }) {
  return (
    <div
      className="op-card"
      style={{
        padding: 24,
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        opacity: 0.7,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'var(--surface-2)',
          color: 'var(--text-muted)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
          {title}{' '}
          <span className="op-chip" style={{ fontSize: 10, verticalAlign: 'middle' }}>
            Phase 2
          </span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{description}</div>
      </div>
    </div>
  )
}

export function AdminDataPage() {
  const { data: counts } = useCounts()
  const { data: datasets, isLoading } = useDatasets()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: '40px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '-.02em',
            margin: '0 0 6px',
            color: 'var(--text)',
          }}
        >
          Data Manager
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px' }}>
          Monitor database contents and manage datasets.
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
          <StatCard
            value={counts?.proteins ?? '—'}
            label="Proteins indexed"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            }
          />
          <StatCard
            value={counts?.interactions ?? '—'}
            label="Interactions"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            }
          />
          <StatCard
            value={datasets?.length ?? '—'}
            label="Datasets"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            }
          />
        </div>

        {/* Datasets table (read-only) */}
        <div style={{ marginBottom: 32 }}>
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
            Registered datasets
          </h3>
          {isLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '16px 0' }}>Loading…</div>
          ) : (
            <div className="op-card" style={{ overflow: 'hidden' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 180px',
                  padding: '12px 20px',
                  background: 'var(--surface-2)',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                <div>Dataset</div>
                <div>Year</div>
                <div>Status</div>
              </div>
              {datasets?.map((ds) => (
                <div
                  key={ds.dataset_reference}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 180px',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'center',
                    fontSize: 13,
                  }}
                >
                  <div>
                    <span
                      className="op-num"
                      style={{ fontWeight: 500, color: 'var(--text)', marginRight: 8 }}
                    >
                      {ds.name}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ds.description}</span>
                  </div>
                  <div className="op-num" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {ds.year ?? '—'}
                  </div>
                  <div>
                    <span className="op-chip" style={{ fontSize: 10 }}>
                      {ds.interaction_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phase 2 actions */}
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
          Data operations
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Phase2Banner
            title="Upload dataset"
            description="Upload a PSI-MI TAB file to add new interaction data. Validates format, previews protein and interaction counts, then inserts into the database."
          />
          <Phase2Banner
            title="Delete dataset"
            description="Remove a registered dataset and all associated interactions from the database. Requires confirmation."
          />
          <Phase2Banner
            title="Update user permissions"
            description="Bulk-update which users have access to a specific dataset's download links."
          />
          <Phase2Banner
            title="Purge database"
            description="Delete all proteins, interactions, and datasets. Irreversible — requires a typed confirmation."
          />
        </div>
      </div>
    </div>
  )
}
