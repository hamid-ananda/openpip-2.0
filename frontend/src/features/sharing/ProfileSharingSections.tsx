import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  useSavedViews,
  useDeleteSavedView,
  useShares,
  useDeleteShare,
  type SavedView,
} from '../../api/sharing'
import { ShareDialog } from './ShareDialog'

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
  const { data: received = [] } = useShares('received')
  const deleteView = useDeleteSavedView()
  const deleteShare = useDeleteShare()
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

      <div className="op-card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={CARD_LABEL}>Shared With Me</div>
        {received.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Nothing yet. Colleagues can send you a network from their own saved views.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {received.map((share) => (
              <div key={share.id} style={ROW}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                    {share.saved_view.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    from{' '}
                    <Link to={`/profile/${share.sender.username}`}>
                      {share.sender.name || share.sender.username}
                    </Link>
                    {share.note && ` · ${share.note}`}
                  </div>
                </div>
                <button
                  className="op-btn"
                  style={{ fontSize: 11, padding: '5px 10px' }}
                  onClick={() => navigate(`/shared/${share.id}`)}
                >
                  Open
                </button>
                <button
                  onClick={() => deleteShare.mutate(share.id)}
                  aria-label={`Dismiss ${share.saved_view.name}`}
                  title="Dismiss"
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
