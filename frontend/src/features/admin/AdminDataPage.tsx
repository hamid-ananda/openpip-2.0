import { useState, useCallback, useEffect, useRef } from 'react'
import { useCounts } from '../../api/counts'
import { useDatasets } from '../../api/downloads'
import {
  useInteractionCategories,
  useDatasetPreview,
  useDatasetUpload,
} from '../../api/datasets'
import type { DatasetPreviewResult } from '../../api/datasets'

// ─────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────

function StatCard({ value, label, icon }: { value: string | number; label: string; icon: React.ReactNode }) {
  return (
    <div
      className="op-card"
      style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: 'var(--primary-soft)',
          color: 'var(--primary)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          className="op-num"
          style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--text)' }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{label}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────

const STEP_LABELS = ['Select file', 'Metadata', 'Preview', 'Result']

function StepIndicator({ current }: { current: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        marginBottom: 28,
      }}
    >
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1
        const done = stepNum < current
        const active = stepNum === current
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_LABELS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--surface-2)',
                  color: done || active ? '#fff' : 'var(--text-muted)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  border: active ? '2px solid var(--primary)' : done ? '2px solid var(--success)' : '2px solid var(--border)',
                  transition: 'background .2s, border-color .2s',
                  flexShrink: 0,
                }}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text)' : done ? 'var(--success)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: done ? 'var(--success)' : 'var(--border)',
                  margin: '0 8px',
                  marginBottom: 20,
                  transition: 'background .2s',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Wizard state
// ─────────────────────────────────────────────────────────

interface WizardState {
  file: File | null
  datasetName: string
  interactionStatus: string
  categoryId: string
}

const INITIAL_STATE: WizardState = {
  file: null,
  datasetName: '',
  interactionStatus: 'published',
  categoryId: '',
}

function buildFormData(state: WizardState): FormData {
  const fd = new FormData()
  if (state.file) fd.append('file', state.file)
  fd.append('dataset_name', state.datasetName)
  fd.append('interaction_status', state.interactionStatus)
  if (state.categoryId) fd.append('category_id', state.categoryId)
  return fd
}

// ─────────────────────────────────────────────────────────
// Step 1 — file picker
// ─────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

interface Step1Props {
  file: File | null
  onChange: (file: File) => void
  onNext: () => void
}

function Step1({ file, onChange, onNext }: Step1Props) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const dropped = e.dataTransfer.files[0]
      if (dropped) onChange(dropped)
    },
    [onChange],
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Drop zone for PSI-MI TAB file"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        style={{
          border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border-strong)'}`,
          borderRadius: 10,
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'var(--primary-soft)' : 'var(--surface-2)',
          transition: 'border-color .15s, background .15s',
          marginBottom: 20,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".tab,.tsv,.txt"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onChange(f)
          }}
        />
        <div style={{ marginBottom: 10 }}>
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            aria-hidden
            style={{ display: 'inline-block' }}
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
          Drag & drop a PSI-MI TAB file
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          or{' '}
          <span style={{ color: 'var(--primary)', fontWeight: 500 }}>browse</span>
          {' '}to select — .tab, .tsv, .txt
        </div>
      </div>

      {file && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: 'var(--surface-2)',
            borderRadius: 8,
            border: '1px solid var(--border)',
            marginBottom: 20,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" aria-hidden>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{file.name}</span>
          <span className="op-chip" style={{ fontSize: 11 }}>{formatBytes(file.size)}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="op-btn primary" onClick={onNext} disabled={!file}>
          Next →
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Step 2 — metadata
// ─────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'validated', label: 'Validated' },
  { value: 'verified', label: 'Verified' },
  { value: 'literature', label: 'Literature' },
]

interface Step2Props {
  state: WizardState
  onChange: (patch: Partial<WizardState>) => void
  onBack: () => void
  onNext: () => void
}

function Step2({ state, onChange, onBack, onNext }: Step2Props) {
  const { data: categories = [], isLoading: catsLoading } = useInteractionCategories()

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Dataset name <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            className="op-input"
            type="text"
            value={state.datasetName}
            onChange={(e) => onChange({ datasetName: e.target.value })}
            placeholder="e.g. HuRI-2024"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Interaction status
          </label>
          <select
            className="op-input"
            value={state.interactionStatus}
            onChange={(e) => onChange({ interactionStatus: e.target.value })}
            style={{ width: '100%' }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Category
          </label>
          <select
            className="op-input"
            value={state.categoryId}
            onChange={(e) => onChange({ categoryId: e.target.value })}
            style={{ width: '100%' }}
            disabled={catsLoading}
          >
            <option value="">— None —</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>{cat.category_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
        <button className="op-btn" onClick={onBack}>← Back</button>
        <button
          className="op-btn primary"
          onClick={onNext}
          disabled={!state.datasetName.trim()}
        >
          Preview →
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Step 3 — dry-run preview
// ─────────────────────────────────────────────────────────

interface Step3Props {
  state: WizardState
  onBack: () => void
  onNext: (result: DatasetPreviewResult) => void
}

function Step3({ state, onBack, onNext }: Step3Props) {
  const preview = useDatasetPreview()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    preview.mutate(buildFormData(state))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const result = preview.data

  return (
    <div>
      {preview.isPending && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <div
            aria-label="Loading preview"
            style={{
              width: 36,
              height: 36,
              border: '3px solid var(--border)',
              borderTop: '3px solid var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <div style={{ fontSize: 14 }}>Running dry-run preview…</div>
        </div>
      )}

      {preview.isError && (
        <div
          style={{
            background: 'rgba(241,87,66,.08)',
            border: '1px solid var(--warn)',
            borderRadius: 8,
            padding: '16px 20px',
            color: 'var(--warn)',
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          Preview failed: {preview.error?.message ?? 'Unknown error'}
        </div>
      )}

      {result && (
        <div>
          <div
            className="op-card"
            style={{ padding: '20px 24px', marginBottom: 16 }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
              Preview results
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div className="op-num" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>
                  {result.proteins_created.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Proteins new</div>
              </div>
              <div>
                <div className="op-num" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>
                  {result.proteins_existing.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Proteins existing</div>
              </div>
              <div>
                <div className="op-num" style={{ fontSize: 22, fontWeight: 600, color: 'var(--success)' }}>
                  {result.interactions_created.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Interactions new</div>
              </div>
              <div>
                <div className="op-num" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-muted)' }}>
                  {result.interactions_skipped.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Interactions skipped</div>
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div
              style={{
                background: 'rgba(245,158,11,.08)',
                border: '1px solid var(--warn)',
                borderRadius: 8,
                padding: '14px 18px',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warn)', marginBottom: 8 }}>
                {result.errors.length} warning{result.errors.length !== 1 ? 's' : ''} — you may still import
              </div>
              <div
                style={{
                  maxHeight: 140,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {result.errors.slice(0, 10).map((err, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                    {err}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <button className="op-btn" onClick={onBack} disabled={preview.isPending}>← Back</button>
        <button
          className="op-btn primary"
          onClick={() => result && onNext(result)}
          disabled={preview.isPending || preview.isError || !result}
        >
          Import →
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Step 4 — final upload
// ─────────────────────────────────────────────────────────

interface Step4Props {
  state: WizardState
  onReset: () => void
}

function Step4({ state, onReset }: Step4Props) {
  const upload = useDatasetUpload()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    upload.mutate(buildFormData(state))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const result = upload.data

  return (
    <div>
      {upload.isPending && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <div
            aria-label="Uploading dataset"
            style={{
              width: 36,
              height: 36,
              border: '3px solid var(--border)',
              borderTop: '3px solid var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <div style={{ fontSize: 14 }}>Importing dataset…</div>
        </div>
      )}

      {upload.isError && (
        <div
          style={{
            background: 'rgba(241,87,66,.08)',
            border: '1px solid var(--warn)',
            borderRadius: 8,
            padding: '16px 20px',
            color: 'var(--warn)',
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          Import failed: {upload.error?.message ?? 'Unknown error'}
        </div>
      )}

      {result && (
        <div
          className="op-card"
          style={{ padding: '24px', textAlign: 'center', marginBottom: 24 }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(16,185,129,.12)',
              color: 'var(--success)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 14px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
            Dataset imported successfully
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <div className="op-num" style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>
                {result.proteins_created.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Proteins created</div>
            </div>
            <div>
              <div className="op-num" style={{ fontSize: 20, fontWeight: 600, color: 'var(--success)' }}>
                {result.interactions_created.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Interactions created</div>
            </div>
            <div>
              <div className="op-num" style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-muted)' }}>
                {result.interactions_skipped.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Interactions skipped</div>
            </div>
          </div>
        </div>
      )}

      {(result || upload.isError) && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="op-btn" onClick={onReset}>
            Upload another file
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Upload wizard orchestrator
// ─────────────────────────────────────────────────────────

function UploadWizard() {
  const [step, setStep] = useState(1)
  const [wizState, setWizState] = useState<WizardState>(INITIAL_STATE)

  const patch = useCallback((p: Partial<WizardState>) => setWizState((s) => ({ ...s, ...p })), [])

  const handleFileChosen = useCallback(
    (file: File) => {
      const name = file.name.replace(/\.[^.]+$/, '')
      patch({ file, datasetName: name })
    },
    [patch],
  )

  const reset = useCallback(() => {
    setStep(1)
    setWizState(INITIAL_STATE)
  }, [])

  return (
    <div>
      <StepIndicator current={step} />

      {step === 1 && (
        <Step1
          file={wizState.file}
          onChange={handleFileChosen}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <Step2
          state={wizState}
          onChange={patch}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <Step3
          state={wizState}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <Step4
          state={wizState}
          onReset={reset}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export function AdminDataPage() {
  const { data: counts } = useCounts()
  const { data: datasets, isLoading } = useDatasets()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: '40px 80px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '-.02em',
            margin: '0 0 6px',
            color: 'var(--text)',
          }}
        >
          Data Manager
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px' }}>
          Monitor database contents and manage datasets.
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
          <StatCard
            value={counts?.proteins ?? '—'}
            label="Proteins indexed"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            }
          />
          <StatCard
            value={counts?.interactions ?? '—'}
            label="Interactions"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            }
          />
          <StatCard
            value={datasets?.length ?? '—'}
            label="Datasets"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            }
          />
        </div>

        {/* Datasets table (read-only) */}
        <div style={{ marginBottom: 32 }}>
          <h3
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              margin: '0 0 14px',
            }}
          >
            Registered datasets
          </h3>
          {isLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '16px 0' }}>Loading…</div>
          ) : (
            <div className="op-card" style={{ overflow: 'hidden' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 180px',
                  padding: '12px 20px',
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
                <div>Status</div>
              </div>
              {datasets?.map((ds) => (
                <div
                  key={ds.dataset_reference}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 180px',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'center',
                    fontSize: 13,
                  }}
                >
                  <div>
                    <span
                      className="op-num"
                      style={{ fontWeight: 500, color: 'var(--text)', marginRight: 8 }}
                    >
                      {ds.name}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ds.description}</span>
                  </div>
                  <div className="op-num" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {ds.year ?? '—'}
                  </div>
                  <div>
                    <span className="op-chip" style={{ fontSize: 10 }}>
                      {ds.interaction_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload wizard */}
        <h3
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            margin: '0 0 14px',
          }}
        >
          Upload dataset
        </h3>
        <div className="op-card" style={{ padding: 24 }}>
          <UploadWizard />
        </div>
      </div>
    </div>
  )
}
