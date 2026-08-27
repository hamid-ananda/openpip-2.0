import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useShareComments, useAddComment } from '../../api/sharing'

/** Flat discussion between the two people a network is shared between. */
export function ShareComments({ shareId }: { shareId: number }) {
  const [body, setBody] = useState('')
  const { data: comments = [] } = useShareComments(shareId)
  const addComment = useAddComment(shareId)

  function submit() {
    const trimmed = body.trim()
    if (!trimmed) return
    addComment.mutate(trimmed, { onSuccess: () => setBody('') })
  }

  return (
    <div style={{ marginTop: 10 }}>
      {comments.map((c) => (
        <div key={c.id} style={{ marginBottom: 8 }}>
          <Link to={`/profile/${c.author.username}`} style={{ fontWeight: 600 }}>
            {c.author.name || c.author.username}
          </Link>
          <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 12 }}>
            {new Date(c.created_at).toLocaleString()}
          </span>
          <p style={{ margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>{c.body}</p>
        </div>
      ))}
      {comments.length === 0 && (
        <p style={{ color: 'var(--text-muted)', margin: '0 0 8px' }}>No comments yet.</p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <label htmlFor={`comment-${shareId}`} className="sr-only" style={{ display: 'none' }}>
          Add a comment
        </label>
        <input
          id={`comment-${shareId}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Add a comment"
          style={{
            flex: 1,
            padding: '6px 8px',
            background: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 6,
          }}
        />
        <button
          type="button"
          className="op-btn"
          onClick={submit}
          disabled={!body.trim() || addComment.isPending}
        >
          Post
        </button>
      </div>
    </div>
  )
}
