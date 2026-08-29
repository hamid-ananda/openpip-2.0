import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useSavedViews,
  useDeleteSavedView,
  type SavedView,
} from '../../api/sharing'
import { ShareDialog } from './ShareDialog'
import { ShareList } from './ShareList'

const CARD_LABEL = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '.08em',
  marginBottom: 16,
}

const ROW = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
}

/**
 * Saved views and the networks other people have shared. Separate from the
 * legacy "Saved Networks" card above: those pin a fixed set of interactions,
 * these re-run the search and show current data.
 */
export function ProfileSharingSections() {
  const navigate = useNavigate()
  const { data: views = [], isLoading: viewsLoading } = useSavedViews()
  const deleteView = useDeleteSavedView()
  const [sharing, setSharing] = useState<SavedView | null>(null)

  return (
    <>
      <div className="op-card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={CARD_LABEL}>My Views</div>
        {viewsLoading ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
        ) : views.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Save a view from the network toolbar to keep its filters and layout.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {views.map((view) => (
              <div key={view.id} style={ROW}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                    {view.name}
                  </div>
                  <span className="op-chip" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
                    {view.query}
                  </span>
                </div>
                <button
                  className="op-btn"
                  style={{ fontSize: 11, padding: '5px 10px' }}
                  onClick={() => navigate(`/search/${encodeURIComponent(view.query)}`)}
                >
                  Open
                </button>
                <button
                  className="op-btn"
                  style={{ fontSize: 11, padding: '5px 10px' }}
                  onClick={() => setSharing(view)}
                >
                  Share
                </button>
                <button
                  onClick={() => deleteView.mutate(view.id)}
                  aria-label={`Delete ${view.name}`}
                  title="Delete"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: 18,
                    lineHeight: 1,
                    padding: 4,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ShareList direction="received" />
      <ShareList direction="sent" />

      {sharing && (
        <ShareDialog
          savedViewId={sharing.id}
          savedViewName={sharing.name}
          onClose={() => setSharing(null)}
        />
      )}
    </>
  )
}
