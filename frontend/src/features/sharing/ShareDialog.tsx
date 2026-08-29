import { useState } from 'react'
import { Modal } from '../search/modals/Modal'
import { useUserSearch, type UserCard } from '../../api/users'
import { useCreateShare, useCreateSavedView } from '../../api/sharing'
import type { ViewState } from '../search/searchStore'

interface ShareDialogProps {
  /** An existing saved view, shared from the profile. */
  savedViewId?: number
  /** The dialog's title, and the default name in capture mode. */
  savedViewName: string
  /**
   * The network on screen right now. Given this instead of an id, sharing
   * saves the view as it sends, so nothing has to be saved first.
   */
  capture?: { query: string; state: Partial<ViewState> }
  onClose: () => void
}

/** Hand one network to one colleague, with a note about what to look at. */
export function ShareDialog({ savedViewId, savedViewName, capture, onClose }: ShareDialogProps) {
  const [term, setTerm] = useState('')
  const [picked, setPicked] = useState<UserCard | null>(null)
  const [note, setNote] = useState('')
  const [name, setName] = useState(savedViewName)
  const { data: matches = [] } = useUserSearch(picked ? '' : term)
  const share = useCreateShare()
  const createView = useCreateSavedView()
  const [failed, setFailed] = useState(false)

  async function submit() {
    if (!picked) return
    setFailed(false)
    try {
      const viewId =
        savedViewId ??
        (await createView.mutateAsync({
          name: name.trim() || savedViewName,
          query: capture!.query,
          state: capture!.state,
        })).id
      await share.mutateAsync({ saved_view: viewId, recipient: picked.username, note })
      onClose()
    } catch {
      setFailed(true)
    }
  }

  return (
    <Modal title={capture ? 'Share this network' : `Share "${savedViewName}"`} onClose={onClose}>
      {capture && (
        <>
          <label htmlFor="share-view-name" style={{ fontSize: 13, color: 'var(--text-soft)' }}>
            Name
          </label>
          <input
            id="share-view-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              marginTop: 4,
              marginBottom: 12,
              padding: '6px 8px',
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 6,
            }}
          />
        </>
      )}
      {picked ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 14, color: 'var(--text)' }}>
            {picked.name || picked.username}
            {picked.affiliation && (
              <span style={{ color: 'var(--text-muted)' }}> · {picked.affiliation}</span>
            )}
          </span>
          <button type="button" className="op-btn" onClick={() => setPicked(null)}>
            Change
          </button>
        </div>
      ) : (
        <>
          <label htmlFor="share-recipient" style={{ fontSize: 13, color: 'var(--text-soft)' }}>
            Name, username, lab, or email
          </label>
          <input
            id="share-recipient"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            autoComplete="off"
            style={{
              width: '100%',
              marginTop: 4,
              marginBottom: 8,
              padding: '6px 8px',
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 6,
            }}
          />
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 160, overflowY: 'auto' }}>
            {matches.map((u) => (
              <li key={u.username}>
                <button
                  type="button"
                  onClick={() => setPicked(u)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 4px',
                    color: 'var(--text)',
                    fontSize: 13,
                  }}
                >
                  {u.name || u.username}
                  {u.affiliation && (
                    <span style={{ color: 'var(--text-muted)' }}> · {u.affiliation}</span>
                  )}
                </button>
              </li>
            ))}
            {term.trim().length >= 2 && matches.length === 0 && (
              <li style={{ fontSize: 13, color: 'var(--text-muted)', padding: '6px 4px' }}>
                Nobody found.
              </li>
            )}
          </ul>
        </>
      )}

      <label htmlFor="share-note" style={{ fontSize: 13, color: 'var(--text-soft)' }}>
        Note (optional)
      </label>
      <textarea
        id="share-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="What should they look at?"
        style={{
          width: '100%',
          marginTop: 4,
          padding: '6px 8px',
          background: 'var(--bg)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          resize: 'vertical',
        }}
      />

      {failed && (
        <p style={{ color: 'var(--danger, #c00)', fontSize: 13 }}>
          That share did not go through. Check the person and try again.
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button type="button" className="op-btn" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="op-btn op-btn-primary"
          onClick={submit}
          disabled={!picked || share.isPending || createView.isPending}
        >
          Share
        </button>
      </div>
    </Modal>
  )
}
