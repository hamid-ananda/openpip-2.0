import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { SearchResultsPage } from '../search/SearchResultsPage'
import { useShare } from '../../api/sharing'
import { useProfile } from '../../api/auth'
import { ShareComments } from './ShareComments'

/**
 * A network someone shared, opened with their filters and layout. The search
 * is re-run rather than restored from a snapshot, so both people are looking
 * at today's data.
 */
export function SharedViewPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { data: share, isLoading, isError } = useShare(id)

  if (isLoading) {
    return <p style={{ padding: 24, color: 'var(--text-muted)' }}>Loading…</p>
  }
  if (isError || !share) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 18, color: 'var(--text)' }}>
          This network is no longer shared with you.
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Whoever sent it may have withdrawn it. <Link to="/profile">Your profile</Link>{' '}
          lists the networks you still have.
        </p>
      </div>
    )
  }

  return (
    <SearchResultsPage
      term={share.saved_view.query}
      viewState={share.saved_view.state}
      banner={<ShareBanner shareId={share.id} share={share} />}
    />
  )
}

function ShareBanner({ shareId, share }: { shareId: number; share: ReturnType<typeof useShare>['data'] }) {
  const [showComments, setShowComments] = useState(false)
  const { data: me } = useProfile()
  if (!share) return null
  // The same page serves both people, so it names the other one.
  const iSent = me?.username === share.sender.username
  const other = iSent ? share.recipient : share.sender

  return (
    <div
      style={{
        padding: '10px 16px',
        background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
        borderBottom: '1px solid var(--border)',
        fontSize: 13,
        color: 'var(--text)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <strong>{share.saved_view.name}</strong>
        <span style={{ color: 'var(--text-muted)' }}>
          {iSent ? 'shared with' : 'shared by'}{' '}
          <Link to={`/profile/${other.username}`}>{other.name || other.username}</Link>
          {' · '}
          {new Date(share.created_at).toLocaleDateString()}
        </span>
        <button
          type="button"
          className="op-btn"
          onClick={() => setShowComments((v) => !v)}
          style={{ marginLeft: 'auto', fontSize: 12 }}
        >
          {showComments ? 'Hide discussion' : 'Discussion'}
        </button>
      </div>
      {share.note && <p style={{ margin: '6px 0 0' }}>{share.note}</p>}
      {showComments && <ShareComments shareId={shareId} />}
    </div>
  )
}
