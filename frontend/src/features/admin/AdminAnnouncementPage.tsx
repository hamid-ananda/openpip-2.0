import { useState } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

const QUILL_STYLE = `
  .ql-editor { min-height: 200px; font-size: 14px; line-height: 1.6; }
  .ql-toolbar.ql-snow { border-bottom: 1px solid var(--border); background: var(--surface-2); border-radius: 8px 8px 0 0; }
  .ql-container.ql-snow { border-radius: 0 0 8px 8px; }
`
import {
  useAdminAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
} from '../../api/announcements'
import type { Announcement } from '../../types/api'

// ─────────────────────────────────────────────────────────
// Quill toolbar config — minimal but practical
// ─────────────────────────────────────────────────────────
const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'link'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
}

const QUILL_FORMATS = ['header', 'bold', 'italic', 'underline', 'link', 'list', 'bullet']

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface FormState {
  title: string
  text: string
  date: string
  showOnHomePage: boolean
}

const EMPTY_FORM: FormState = { title: '', text: '', date: '', showOnHomePage: true }

// ─────────────────────────────────────────────────────────
// Announcement form (create / edit)
// ─────────────────────────────────────────────────────────
interface AnnouncementFormProps {
  initial?: FormState
  isPending: boolean
  onSubmit: (data: FormState) => void
  onCancel: () => void
  submitLabel: string
}

function AnnouncementForm({ initial, isPending, onSubmit, onCancel, submitLabel }: AnnouncementFormProps) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM)

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Title */}
      <div style={{ marginBottom: 16 }}>
        <span
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-muted)',
            marginBottom: 6,
          }}
        >
          Title <span style={{ color: 'var(--danger)' }}>*</span>
        </span>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Announcement title"
          className="op-input"
        />
      </div>

      {/* Date + home page toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 16, alignItems: 'end' }}>
        <div>
          <span
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginBottom: 6,
            }}
          >
            Date
          </span>
          <input
            type="datetime-local"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className="op-input"
          />
        </div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 14px',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            color: 'var(--text-muted)',
            background: 'var(--surface)',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <input
            type="checkbox"
            checked={form.showOnHomePage}
            onChange={(e) => set('showOnHomePage', e.target.checked)}
            style={{ accentColor: 'var(--primary)', width: 15, height: 15 }}
          />
          Show on home page
        </label>
      </div>

      {/* Rich text body */}
      <div style={{ marginBottom: 20 }}>
        <span
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-muted)',
            marginBottom: 6,
          }}
        >
          Body <span style={{ color: 'var(--danger)' }}>*</span>
        </span>
        <div
          style={{
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            background: 'var(--surface)',
          }}
        >
          <ReactQuill
            theme="snow"
            value={form.text}
            onChange={(v) => set('text', v)}
            modules={QUILL_MODULES}
            formats={QUILL_FORMATS}
            placeholder="Write your announcement…"
            style={{ fontFamily: 'var(--font)', fontSize: 13 }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          disabled={isPending || !form.title.trim() || form.text === '<p><br></p>' || !form.text.trim()}
          className="op-btn primary"
          style={{ padding: '9px 20px' }}
        >
          {isPending ? 'Saving…' : submitLabel}
        </button>
        <button type="button" className="op-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────
// Single announcement card (active or history)
// ─────────────────────────────────────────────────────────
interface AnnouncementCardProps {
  ann: Announcement
  isHistory?: boolean
  onEdit: (ann: Announcement) => void
  onHide: (ann: Announcement) => void
  onRestore: (ann: Announcement) => void
  onDelete: (ann: Announcement) => void
  editingId: number | null
  onCancelEdit: () => void
  updatePending: boolean
  onSaveEdit: (ann: Announcement, data: FormState) => void
}

function AnnouncementCard({
  ann,
  isHistory,
  onEdit,
  onHide,
  onRestore,
  onDelete,
  editingId,
  onCancelEdit,
  updatePending,
  onSaveEdit,
}: AnnouncementCardProps) {
  const isEditing = editingId === ann.id

  const initialForm: FormState = {
    title: ann.title,
    text: ann.text,
    date: ann.date ? ann.date.slice(0, 16) : '',
    showOnHomePage: ann.showOnHomePage,
  }

  return (
    <div
      className="op-card"
      style={{
        padding: 20,
        marginBottom: 12,
        opacity: isHistory ? 0.8 : 1,
      }}
    >
      {isEditing ? (
        <AnnouncementForm
          initial={initialForm}
          isPending={updatePending}
          onSubmit={(data) => onSaveEdit(ann, data)}
          onCancel={onCancelEdit}
          submitLabel="Save changes"
        />
      ) : (
        <>
          {/* Card header */}
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
              <div
                style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}
              >
                {ann.title}
              </div>
              {ann.date && (
                <span className="op-num" style={{ fontSize: 11, color: 'var(--text-soft)' }}>
                  {new Date(ann.date).toLocaleDateString('en-CA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {ann.showOnHomePage && (
                <span className="op-chip primary" style={{ fontSize: 11 }}>
                  Home
                </span>
              )}
              {!isHistory ? (
                <>
                  <button
                    type="button"
                    className="op-btn"
                    style={{ padding: '5px 12px', fontSize: 12 }}
                    onClick={() => onEdit(ann)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="op-btn"
                    style={{ padding: '5px 12px', fontSize: 12, color: 'var(--text-muted)' }}
                    onClick={() => onHide(ann)}
                  >
                    Hide
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="op-btn"
                    style={{ padding: '5px 12px', fontSize: 12, color: 'var(--success)' }}
                    onClick={() => onRestore(ann)}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    className="op-btn"
                    style={{ padding: '5px 12px', fontSize: 12, color: 'var(--danger)' }}
                    onClick={() => onDelete(ann)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Body preview */}
          <div
            style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: ann.text }}
          />
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Page shell
// ─────────────────────────────────────────────────────────
export function AdminAnnouncementPage() {
  const { data: allAnnouncements, isLoading } = useAdminAnnouncements()
  const { mutate: createAnn, isPending: createPending } = useCreateAnnouncement()
  const { mutate: updateAnn, isPending: updatePending } = useUpdateAnnouncement()
  const { mutate: deleteAnn } = useDeleteAnnouncement()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const active = (allAnnouncements ?? []).filter((a) => a.show)
  const history = (allAnnouncements ?? []).filter((a) => !a.show)

  const handleCreate = (data: FormState) => {
    createAnn(
      {
        title: data.title,
        text: data.text,
        date: data.date || null,
        show: true,
        showOnHomePage: data.showOnHomePage,
      },
      { onSuccess: () => setShowForm(false) },
    )
  }

  const handleHide = (ann: Announcement) => {
    updateAnn({ id: ann.id, data: { show: false } })
  }

  const handleRestore = (ann: Announcement) => {
    updateAnn({ id: ann.id, data: { show: true } })
  }

  const handleDelete = (ann: Announcement) => {
    if (!window.confirm(`Permanently delete "${ann.title}"? This cannot be undone.`)) return
    deleteAnn(ann.id)
  }

  const handleSaveEdit = (ann: Announcement, data: FormState) => {
    updateAnn(
      {
        id: ann.id,
        data: {
          title: data.title,
          text: data.text,
          date: data.date || null,
          showOnHomePage: data.showOnHomePage,
        },
      },
      { onSuccess: () => setEditingId(null) },
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: '40px 48px' }}>
      <style>{QUILL_STYLE}</style>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* ── Header ── */}
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
            onClick={() => {
              setShowForm((v) => !v)
              setEditingId(null)
            }}
            style={{ gap: 8, display: 'inline-flex', alignItems: 'center' }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New announcement
          </button>
        </div>

        {/* ── Create form ── */}
        {showForm && (
          <div
            className="op-card"
            style={{ padding: 24, marginBottom: 24, background: 'var(--surface-2)' }}
          >
            <h2
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                margin: '0 0 20px',
              }}
            >
              New announcement
            </h2>
            <AnnouncementForm
              isPending={createPending}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              submitLabel="Publish"
            />
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div style={{ padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
            Loading announcements…
          </div>
        )}

        {/* ── Active section ── */}
        {!isLoading && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  margin: 0,
                }}
              >
                Active
              </h2>
              <span className="op-num" style={{ fontSize: 11, color: 'var(--text-soft)' }}>
                {active.length}
              </span>
            </div>

            {active.length === 0 ? (
              <div
                className="op-card"
                style={{
                  padding: 40,
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 14,
                  marginBottom: 32,
                }}
              >
                No active announcements.
              </div>
            ) : (
              <div style={{ marginBottom: 32 }}>
                {active.map((ann) => (
                  <AnnouncementCard
                    key={ann.id}
                    ann={ann}
                    editingId={editingId}
                    onEdit={(a) => {
                      setEditingId(a.id)
                      setShowForm(false)
                    }}
                    onHide={handleHide}
                    onRestore={handleRestore}
                    onDelete={handleDelete}
                    onCancelEdit={() => setEditingId(null)}
                    updatePending={updatePending}
                    onSaveEdit={handleSaveEdit}
                  />
                ))}
              </div>
            )}

            {/* ── History section ── */}
            {history.length > 0 && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <h2
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                      margin: 0,
                    }}
                  >
                    History
                  </h2>
                  <span className="op-num" style={{ fontSize: 11, color: 'var(--text-soft)' }}>
                    {history.length}
                  </span>
                </div>

                {history.map((ann) => (
                  <AnnouncementCard
                    key={ann.id}
                    ann={ann}
                    isHistory
                    editingId={editingId}
                    onEdit={(a) => {
                      setEditingId(a.id)
                      setShowForm(false)
                    }}
                    onHide={handleHide}
                    onRestore={handleRestore}
                    onDelete={handleDelete}
                    onCancelEdit={() => setEditingId(null)}
                    updatePending={updatePending}
                    onSaveEdit={handleSaveEdit}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
