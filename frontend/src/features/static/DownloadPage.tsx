import { useAuthStore } from '../../store/authStore'
import { useDatasets } from '../../api/downloads'

const STATUS_BADGE: Record<string, string> = {
  Published: 'var(--literature)',
  Validated: 'var(--success)',
  Verified: 'var(--hi-union)',
  Literature: 'var(--accent)',
}

function KindChip({ status }: { status: string }) {
  const color = STATUS_BADGE[status] ?? 'var(--text-muted)'
  return (
    <span
      className="op-chip"
      style={{ color, background: 'transparent', borderColor: 'var(--border)', fontSize: 10 }}
    >
      {status}
    </span>
  )
}

export function DownloadPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const { data: datasets, isLoading } = useDatasets()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      {/* Header */}
      <section style={{ padding: '48px 80px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="op-chip primary" style={{ marginBottom: 16 }}>
            Bulk data
          </div>
          <h1
            style={{
              fontSize: 38,
              fontWeight: 600,
              letterSpacing: '-.025em',
              margin: '0 0 12px',
              color: 'var(--text)',
            }}
          >
            Downloads
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--text-muted)',
              margin: 0,
              maxWidth: 640,
              lineHeight: 1.6,
            }}
          >
            Every dataset hosted on openPIP, available as PSI-MI tab, SIF, or CSV.
            {!isLoggedIn && (
              <span>
                {' '}
                <a href="/login" style={{ color: 'var(--primary)' }}>
                  Sign in
                </a>{' '}
                to access download links.
              </span>
            )}
          </p>
        </div>
      </section>

      {/* Moratorium notice */}
      <section style={{ padding: '0 80px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            className="op-card"
            style={{
              padding: '16px 20px',
              borderLeft: '3px solid var(--warn)',
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
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
              aria-hidden="true"
            >
              <path d="M12 9v4m0 4h.01M10.3 3.86l-8.6 14.91A2 2 0 0 0 3.4 22h17.2a2 2 0 0 0 1.7-3.23L13.7 3.86a2 2 0 0 0-3.4 0Z" />
            </svg>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>
                Publication moratorium
              </div>
              <div
                style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 680 }}
              >
                Preliminary, unpublished CCSB Human Interactome data has a 12-month moratorium on
                global analysis. Small-scale use (up to 10 interactions) is permitted.{' '}
                <a href="/about" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                  Read full guidelines →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dataset table */}
      <section style={{ padding: '0 80px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {isLoading ? (
            <div style={{ padding: '48px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              Loading datasets…
            </div>
          ) : (
            <div className="op-card" style={{ overflow: 'hidden' }}>
              {/* Table header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 160px 200px',
                  padding: '14px 24px',
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
                <div style={{ textAlign: 'right' }}>Download</div>
              </div>

              {/* Table rows */}
              {datasets?.map((ds) => (
                <div
                  key={ds.dataset_reference}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 160px 200px',
                    padding: '16px 24px',
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 3,
                      }}
                    >
                      <span
                        className="op-num"
                        style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)' }}
                      >
                        {ds.name}
                      </span>
                      <KindChip status={ds.interaction_status} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {ds.description}{ds.dataset_author ? ` — ${ds.dataset_author}` : ''}
                    </div>
                  </div>

                  <div
                    className="op-num"
                    style={{ fontSize: 13, color: 'var(--text-muted)' }}
                  >
                    {ds.year ?? '—'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    {isLoggedIn ? (
                      <>
                        {['tab', 'sif', 'csv'].map((fmt) => (
                          <a
                            key={fmt}
                            href={`/api/datasets/${ds.dataset_reference}/download?format=${fmt}`}
                            className="op-btn"
                            style={{
                              padding: '5px 10px',
                              fontSize: 11,
                              fontFamily: 'var(--mono)',
                              textTransform: 'uppercase',
                            }}
                          >
                            .{fmt}
                          </a>
                        ))}
                      </>
                    ) : (
                      <a
                        href="/login"
                        style={{ fontSize: 12, color: 'var(--text-soft)', textDecoration: 'none' }}
                      >
                        Sign in to download
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {datasets?.length === 0 && (
                <div style={{ padding: '32px 24px', color: 'var(--text-muted)', fontSize: 14 }}>
                  No datasets available.
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
