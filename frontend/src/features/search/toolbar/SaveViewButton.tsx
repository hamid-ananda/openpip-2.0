import { useState } from 'react'
import { useSearchStore, captureViewState } from '../searchStore'
import { useCreateSavedView, type SavedView } from '../../../api/sharing'
import { useAuthStore } from '../../../store/authStore'
import { ShareDialog } from '../../sharing/ShareDialog'
import { Modal } from '../modals/Modal'
import { CONTROL_HEIGHT, CONTROL_BG } from './LayoutDropdown'

/**
 * Saves the current search together with its filters and layout. The network
 * itself is not stored — reopening the view re-runs the search.
 */
export function SaveViewButton() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const searchTerm = useSearchStore((s) => s.searchTerm)
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState<SavedView | null>(null)
  const createView = useCreateSavedView()

  if (!isLoggedIn || !searchTerm) return null

  function open() {
    setName(searchTerm)
    setNaming(true)
  }

  function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    createView.mutate(
      { name: trimmed, query: searchTerm, state: captureViewState() },
      {
        onSuccess: (view) => {
          setNaming(false)
          setSaved(view)
        },
      },
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="op-btn"
        style={{ height: CONTROL_HEIGHT, fontSize: 12, padding: '0 10px', background: CONTROL_BG }}
      >
        Save view
      </button>

      {naming && (
        <Modal title="Save this view" onClose={() => setNaming(false)}>
          <label htmlFor="saved-view-name" style={{ fontSize: 13, color: 'var(--text-soft)' }}>
            Name
          </label>
          <input
            id="saved-view-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              marginTop: 4,
              padding: '6px 8px',
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 6,
            }}
          />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Saves the search and its current filters and layout. Opening it later runs
            the search again, so the data is always current.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button type="button" className="op-btn" onClick={() => setNaming(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="op-btn op-btn-primary"
              onClick={save}
              disabled={!name.trim() || createView.isPending}
            >
              Save
            </button>
          </div>
        </Modal>
      )}

      {saved && (
        <ShareDialog
          savedViewId={saved.id}
          savedViewName={saved.name}
          onClose={() => setSaved(null)}
        />
      )}
    </>
  )
}
