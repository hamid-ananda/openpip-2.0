import { useState } from 'react'
import { useCitationLookup, useDatasetUpdate } from '../../api/datasets'
import type { DatasetEditable } from '../../api/datasets'
import type { DatasetRef, PublicationStatus } from '../../types/api'

const PUBLICATION_STATUS_OPTIONS: { value: PublicationStatus; label: string }[] = [
  { value: 'published', label: 'Published' },
  { value: 'preprint', label: 'Preprint' },
  { value: 'unpublished', label: 'Unpublished' },
]

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text)',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  margin: '0 0 14px',
  paddingBottom: 8,
  borderBottom: '1px solid var(--border)',
}

const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  margin: '5px 0 0',
  lineHeight: 1.5,
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <p style={hintStyle}>{hint}</p>}
    </div>
  )
}

/** The form's working copy: every field a string so inputs stay controlled. */
interface FormState {
  pubmed_id: string
  doi: string
  author: string
  year: string
  title: string
  journal: string
  url: string
  publication_status: PublicationStatus
  about_heading: string
  about_body: string
  show_on_about: boolean
  about_order: string
}

function toFormState(ds: DatasetRef): FormState {
  return {
    pubmed_id: ds.pubmed_id ?? '',
    doi: ds.doi ?? '',
    author: ds.author ?? '',
    year: ds.year ?? '',
    title: ds.title ?? '',
    journal: ds.journal ?? '',
    url: ds.url ?? '',
    publication_status: ds.publication_status ?? 'unpublished',
    about_heading: ds.about_heading ?? '',
    about_body: ds.about_body ?? '',
    show_on_about: ds.show_on_about ?? true,
    about_order: String(ds.about_order ?? 0),
  }
}

/**
 * Turn the form into a PATCH body.
 *
 * Blank text fields are sent as empty strings rather than omitted, so that
 * clearing a wrong citation actually clears it on the server instead of
 * silently leaving the old value in place.
 */
function toPatch(form: FormState): DatasetEditable {
  return {
    pubmed_id: form.pubmed_id.trim(),
    doi: form.doi.trim(),
    author: form.author.trim(),
    year: form.year.trim(),
    title: form.title.trim(),
    journal: form.journal.trim(),
    url: form.url.trim(),
    publication_status: form.publication_status,
    about_heading: form.about_heading.trim(),
    about_body: form.about_body,
    show_on_about: form.show_on_about,
    about_order: Number(form.about_order) || 0,
  }
}

/** Pull a per-field message out of a DRF 400 body, else a single summary line. */
function errorMessage(error: unknown): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data
  if (data && typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>)
    if (entries.length) {
      return entries
        .map(([field, messages]) => {
          const text = Array.isArray(messages) ? messages.join(' ') : String(messages)
          return field === 'detail' ? text : `${field}: ${text}`
        })
        .join('  ')
    }
  }
  return (error as Error)?.message ?? 'Something went wrong.'
}

interface DatasetEditDialogProps {
  dataset: DatasetRef
  onClose: () => void
}

export function DatasetEditDialog({ dataset, onClose }: DatasetEditDialogProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(dataset))
  const [lookupNote, setLookupNote] = useState<string | null>(null)

  const update = useDatasetUpdate()
  const lookup = useCitationLookup()

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  const handleLookup = async () => {
    setLookupNote(null)
    const pmid = form.pubmed_id.trim()
    const doi = form.doi.trim()
    if (!pmid && !doi) {
      setLookupNote('Enter a PubMed ID or a DOI first.')
      return
    }

    try {
      const found = await lookup.mutateAsync(pmid ? { pubmed_id: pmid } : { doi })
      // Only fill blanks — never overwrite something the admin typed by hand.
      setForm((f) => ({
        ...f,
        pubmed_id: f.pubmed_id || found.pubmed_id || '',
        doi: f.doi || found.doi || '',
        author: f.author || found.author || '',
        year: f.year || found.year || '',
        title: f.title || found.title || '',
        journal: f.journal || found.journal || '',
        url: f.url || found.url || '',
        publication_status:
          f.publication_status === 'unpublished' ? 'published' : f.publication_status,
      }))
      setLookupNote('Found — empty fields filled in. Review before saving.')
    } catch (error) {
      setLookupNote(errorMessage(error))
    }
  }

  const handleSave = async () => {
    try {
      await update.mutateAsync({ id: dataset.id, patch: toPatch(form) })
      onClose()
    } catch {
      // Rendered from update.error below; the dialog stays open so the admin
      // can fix the field rather than lose what they typed.
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.45)',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={`Edit ${dataset.name}`}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Edit {dataset.name}
            </h2>
            <p style={{ ...hintStyle, margin: '3px 0 0' }}>
              Citation details and the paragraph shown on the About page.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 18,
              lineHeight: 1,
              padding: '0 0 0 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* ── Citation ── */}
          <section>
            <h3 style={sectionHeadingStyle}>Citation</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <Field label="PubMed ID" hint="Digits only, e.g. 25416956.">
                  <input
                    className="op-input"
                    style={{ width: '100%' }}
                    value={form.pubmed_id}
                    onChange={(e) => set({ pubmed_id: e.target.value })}
                    placeholder="25416956"
                  />
                </Field>
                <Field label="DOI" hint="For preprints without a PubMed ID.">
                  <input
                    className="op-input"
                    style={{ width: '100%' }}
                    value={form.doi}
                    onChange={(e) => set({ doi: e.target.value })}
                    placeholder="10.1016/j.cell.2014.10.050"
                  />
                </Field>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  className="op-btn"
                  onClick={handleLookup}
                  disabled={lookup.isPending}
                >
                  {lookup.isPending ? 'Looking up…' : 'Look up details'}
                </button>
                {lookupNote && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lookupNote}</span>
                )}
              </div>

              <Field label="Title">
                <input
                  className="op-input"
                  style={{ width: '100%' }}
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="A proteome-scale map of the human interactome network"
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, alignItems: 'start' }}>
                <Field label="Journal">
                  <input
                    className="op-input"
                    style={{ width: '100%' }}
                    value={form.journal}
                    onChange={(e) => set({ journal: e.target.value })}
                    placeholder="Cell"
                  />
                </Field>
                <Field label="Year">
                  <input
                    className="op-input"
                    style={{ width: '100%' }}
                    value={form.year}
                    onChange={(e) => set({ year: e.target.value })}
                    placeholder="2014"
                  />
                </Field>
                <Field label="Status">
                  <select
                    className="op-input"
                    style={{ width: '100%' }}
                    value={form.publication_status}
                    onChange={(e) =>
                      set({ publication_status: e.target.value as PublicationStatus })
                    }
                  >
                    {PUBLICATION_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Authors" hint="As it should read in the reference, e.g. Rolland et al.">
                <input
                  className="op-input"
                  style={{ width: '100%' }}
                  value={form.author}
                  onChange={(e) => set({ author: e.target.value })}
                  placeholder="Rolland et al."
                />
              </Field>

              <Field label="Link" hint="Where the paper or preprint can be read.">
                <input
                  className="op-input"
                  style={{ width: '100%' }}
                  value={form.url}
                  onChange={(e) => set({ url: e.target.value })}
                  placeholder="https://pubmed.ncbi.nlm.nih.gov/25416956/"
                />
              </Field>
            </div>
          </section>

          {/* ── About page ── */}
          <section>
            <h3 style={sectionHeadingStyle}>About page</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Heading" hint={`Leave blank to use the dataset name (${dataset.name}).`}>
                <input
                  className="op-input"
                  style={{ width: '100%' }}
                  value={form.about_heading}
                  onChange={(e) => set({ about_heading: e.target.value })}
                  placeholder={dataset.name}
                />
              </Field>

              <Field
                label="Paragraph"
                hint="Describes what this dataset is — the search space, the assay, how many interactions. Shown above the citation on the About page."
              >
                <textarea
                  className="op-input"
                  style={{ width: '100%', minHeight: 140, resize: 'vertical', lineHeight: 1.6 }}
                  value={form.about_body}
                  onChange={(e) => set({ about_body: e.target.value })}
                  placeholder="Describe the screen, its search space, and what was identified…"
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'center' }}>
                <Field label="Order" hint="Lower numbers appear first.">
                  <input
                    className="op-input"
                    type="number"
                    style={{ width: '100%' }}
                    value={form.about_order}
                    onChange={(e) => set({ about_order: e.target.value })}
                  />
                </Field>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    color: 'var(--text)',
                    cursor: 'pointer',
                    marginTop: 14,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.show_on_about}
                    onChange={(e) => set({ show_on_about: e.target.checked })}
                  />
                  Show on the About page
                </label>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '14px 24px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--danger)', flex: 1 }}>
            {update.isError ? errorMessage(update.error) : ''}
          </span>
          <button className="op-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="op-btn primary" onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
