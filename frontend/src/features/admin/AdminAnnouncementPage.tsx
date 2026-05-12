import { useState } from 'react'
import { useAnnouncements } from '../../api/announcements'
import type { Announcement } from '../../types/api'

function AnnouncementCard({ ann }: { ann: Announcement }) {
  return (
    <div
      className="op-card"
      style={{ padding: 20, marginBottom: 12 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>
            {ann.title}
          </div>
          {ann.date && (
            <span
              className="op-num"
              style={{ fontSize: 11, color: 'var(--text-soft)' }}
            >
              {ann.date}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {ann.showOnHomePage && (
            <span className="op-chip primary">Shown on home</span>
          )}
        </div>
      </div>
      <div
        style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: ann.text }}
      />
    </div>
  )
}

export function AdminAnnouncementPage() {
  const { data: announcements, isLoading } = useAnnouncements()
  const [showForm, setShowForm] = useState(false)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: '40px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 28,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: '-.02em',
                margin: '0 0 4px',
                color: 'var(--text)',
              }}
            >
              Announcements
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
              Manage site-wide announcements shown to users.
            </p>
          </div>
          <button
            className="op-btn primary"
            onClick={() => setShowForm((v) => !v)}
            style={{ gap: 8 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New announcement
          </button>
        </div>

        {/* New announcement form placeholder */}
        {showForm && (
          <div className="op-card" style={{ padding: 24, marginBottom: 24, background: 'var(--surface-2)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: 'color-mix(in oklab, var(--warn) 10%, transparent)',
                border: '1px solid var(--warn)',
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                <strong>Phase 2 feature.</strong> The announcement editor requires the backend CRUD endpoints, which are scheduled for Phase 2 of the migration.
              </span>
            </div>
            <button
              type="button"
              className="op-btn"
              onClick={() => setShowForm(false)}
              style={{ fontSize: 12 }}
            >
              Close
            </button>
          </div>
        )}

        {/* Announcement list */}
        {isLoading ? (
          <div style={{ padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
            Loading announcements…
          </div>
        ) : !announcements?.length ? (
          <div
            className="op-card"
            style={{
              padding: 48,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            No announcements yet.
          </div>
        ) : (
          announcements.map((ann) => <AnnouncementCard key={ann.id} ann={ann} />)
        )}
      </div>
    </div>
  )
}
