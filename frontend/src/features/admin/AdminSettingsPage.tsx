import { useState, useCallback, useRef, useEffect } from 'react'
import { useSettings, useUpdateSettings, useUploadLogo, useDeleteLogo } from '../../api/settings'
import { injectCSSVars } from '../../lib/theme'
import type { AdminSettings } from '../../types/api'
import { RichTextEditor } from '../../components/RichTextEditor'
import {
  useInteractionCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../api/interactionCategories'
import type { InteractionCategory } from '../../types/api'

// ─────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────
const DEFAULT_COLORS: Partial<AdminSettings> = {
  navStyle:            'solid',
  mainColorScheme:     '#2563eb',
  mainColorScheme2:    '#0ea5e9',
  gradientAngle:       135,
  headerColorScheme:   '#ffffff',
  logoColorScheme:     '#ffffff',
  buttonColorScheme:   '#2563eb',
  queryNodeColor:      '#e11d48',
  interactorNodeColor: '#2563eb',
  publishedEdgeColor:  '#38761d',
  validatedEdgeColor:  '#1155cc',
  verifiedEdgeColor:   '#cc0000',
  literatureEdgeColor: '#0ea5e9',
}

// ─────────────────────────────────────────────────────────
// Preset themes
// ─────────────────────────────────────────────────────────
interface Preset {
  name: string
  preview: string
  colors: Partial<AdminSettings>
}

const PRESETS: Preset[] = [
  {
    name: 'openPIP Blue',
    preview: 'linear-gradient(135deg,#2563eb,#0ea5e9)',
    colors: { navStyle:'gradient', mainColorScheme:'#2563eb', mainColorScheme2:'#0ea5e9', gradientAngle:135, headerColorScheme:'#ffffff', queryNodeColor:'#e11d48', interactorNodeColor:'#2563eb', literatureEdgeColor:'#0ea5e9', publishedEdgeColor:'#7c3aed', validatedEdgeColor:'#1155cc', verifiedEdgeColor:'#cc0000' },
  },
  {
    name: 'Crimson',
    preview: 'linear-gradient(135deg,#a51c30,#e11d48)',
    colors: { navStyle:'gradient', mainColorScheme:'#a51c30', mainColorScheme2:'#e11d48', gradientAngle:135, headerColorScheme:'#ffffff', queryNodeColor:'#ff6b6b', interactorNodeColor:'#a51c30', literatureEdgeColor:'#0ea5e9', publishedEdgeColor:'#7c3aed', validatedEdgeColor:'#1155cc', verifiedEdgeColor:'#e11d48' },
  },
  {
    name: 'Forest',
    preview: 'linear-gradient(135deg,#166534,#10b981)',
    colors: { navStyle:'gradient', mainColorScheme:'#166534', mainColorScheme2:'#10b981', gradientAngle:135, headerColorScheme:'#ffffff', queryNodeColor:'#e11d48', interactorNodeColor:'#166534', literatureEdgeColor:'#0ea5e9', publishedEdgeColor:'#10b981', validatedEdgeColor:'#1155cc', verifiedEdgeColor:'#cc0000' },
  },
  {
    name: 'Purple',
    preview: 'linear-gradient(135deg,#6d28d9,#a855f7)',
    colors: { navStyle:'gradient', mainColorScheme:'#6d28d9', mainColorScheme2:'#a855f7', gradientAngle:135, headerColorScheme:'#ffffff', queryNodeColor:'#e11d48', interactorNodeColor:'#6d28d9', literatureEdgeColor:'#38bdf8', publishedEdgeColor:'#a855f7', validatedEdgeColor:'#6d28d9', verifiedEdgeColor:'#e11d48' },
  },
  {
    name: 'Ocean',
    preview: 'linear-gradient(135deg,#0f766e,#06b6d4)',
    colors: { navStyle:'gradient', mainColorScheme:'#0f766e', mainColorScheme2:'#06b6d4', gradientAngle:135, headerColorScheme:'#ffffff', queryNodeColor:'#e11d48', interactorNodeColor:'#0f766e', literatureEdgeColor:'#06b6d4', publishedEdgeColor:'#10b981', validatedEdgeColor:'#0f766e', verifiedEdgeColor:'#e11d48' },
  },
  {
    name: 'Midnight',
    preview: 'linear-gradient(135deg,#0f172a,#1e40af)',
    colors: { navStyle:'gradient', mainColorScheme:'#0f172a', mainColorScheme2:'#1e40af', gradientAngle:135, headerColorScheme:'#94a3b8', queryNodeColor:'#fb7185', interactorNodeColor:'#60a5fa', literatureEdgeColor:'#38bdf8', publishedEdgeColor:'#a78bfa', validatedEdgeColor:'#60a5fa', verifiedEdgeColor:'#fb7185' },
  },
  {
    name: 'Sunset',
    preview: 'linear-gradient(135deg,#dc2626,#ea580c,#f59e0b)',
    colors: { navStyle:'gradient', mainColorScheme:'#dc2626', mainColorScheme2:'#f59e0b', gradientAngle:135, headerColorScheme:'#ffffff', queryNodeColor:'#dc2626', interactorNodeColor:'#ea580c', literatureEdgeColor:'#f59e0b', publishedEdgeColor:'#10b981', validatedEdgeColor:'#1155cc', verifiedEdgeColor:'#dc2626' },
  },
  {
    name: 'Light',
    preview: 'var(--surface)',
    colors: { navStyle:'light', mainColorScheme:'#2563eb', headerColorScheme:'#1e293b', logoColorScheme:'#2563eb' },
  },
]

// ─────────────────────────────────────────────────────────
// Field metadata
// ─────────────────────────────────────────────────────────
type TabId = 'global' | 'home' | 'search' | 'about' | 'faqs' | 'contact' | 'downloads'

const TABS: { id: TabId; label: string }[] = [
  { id: 'global',    label: 'Global Settings' },
  { id: 'home',      label: 'Home Page' },
  { id: 'search',    label: 'Search' },
  { id: 'about',     label: 'About' },
  { id: 'faqs',      label: 'FAQs' },
  { id: 'contact',   label: 'Contact' },
  { id: 'downloads', label: 'Downloads' },
]

// ─────────────────────────────────────────────────────────
// Small reusable form primitives
// ─────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--text-muted)',
        marginBottom: 6,
      }}
    >
      {children}
    </span>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="op-input"
    />
  )
}

function TextareaInput({
  value,
  onChange,
  rows = 4,
  mono,
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
  mono?: boolean
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      style={{
        width: '100%',
        padding: '9px 12px',
        borderRadius: 8,
        border: '1px solid var(--border-strong)',
        background: 'var(--surface)',
        fontFamily: mono ? 'var(--mono)' : 'var(--font)',
        fontSize: 13,
        color: 'var(--text)',
        outline: 'none',
        resize: 'vertical',
        lineHeight: 1.6,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--primary)'
        e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--border-strong)'
        e.target.style.boxShadow = 'none'
      }}
    />
  )
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
      }}
    >
      <label
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: 8,
          overflow: 'hidden',
          border: '2px solid var(--border-strong)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: value,
            borderRadius: 6,
          }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            width: '100%',
            height: '100%',
            cursor: 'pointer',
          }}
        />
      </label>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
          {label}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value)
          }}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            border: 'none',
            background: 'transparent',
            outline: 'none',
            width: 80,
            padding: 0,
          }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────
interface TabPanelProps {
  active: boolean
  children: React.ReactNode
}

function TabPanel({ active, children }: TabPanelProps) {
  return (
    <div style={{ padding: '28px 32px', display: active ? 'block' : 'none' }} aria-hidden={!active}>
      {children}
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        margin: '0 0 16px',
      }}
    >
      {children}
    </h3>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <SectionHeader>{title}</SectionHeader>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Live header preview
// ─────────────────────────────────────────────────────────
function NavPreview({
  style = 'solid', main, main2, angle = 135, header,
}: {
  style?: string; main: string; main2?: string; angle?: number; header: string
}) {
  let bg: string
  if (style === 'gradient') bg = `linear-gradient(${angle}deg, ${main}, ${main2 ?? '#0ea5e9'})`
  else if (style === 'light') bg = 'var(--surface)'
  else bg = main

  const borderB = style === 'light' ? '1px solid var(--border)' : 'none'

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', marginTop: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', padding: '6px 10px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        Navbar preview
      </div>
      <div style={{ background: bg, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 24, borderBottom: borderB }}>
        {/* Mini logo */}
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden>
          <circle cx="16" cy="16" r="4" fill="rgba(255,255,255,0.9)" />
          <circle cx="5"  cy="8"  r="2.2" fill="rgba(255,255,255,0.65)" />
          <circle cx="27" cy="9"  r="2.2" fill="rgba(255,255,255,0.65)" />
          <circle cx="6"  cy="25" r="2.2" fill="rgba(255,255,255,0.65)" />
          <circle cx="26" cy="25" r="2.2" fill="rgba(255,255,255,0.65)" />
        </svg>
        <span style={{ color: header, fontWeight: 600, fontSize: 13 }}>openPIP</span>
        {['Home', 'Search', 'Downloads', 'About'].map((l) => (
          <span key={l} style={{ color: header, opacity: 0.72, fontSize: 12 }}>{l}</span>
        ))}
        <span style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.35)', color: header, fontSize: 11, fontWeight: 600 }}>
          Register
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Mini network preview
// ─────────────────────────────────────────────────────────
function NetworkPreview({
  queryColor,
  interactorColor,
  edgeColors,
}: {
  queryColor: string
  interactorColor: string
  edgeColors: { published: string; validated: string; verified: string; literature: string }
}) {
  const nodes = [
    { id: 'BAD',    x: 120, y: 100, query: true },
    { id: 'BCL2',   x: 230, y: 50,  query: false },
    { id: 'AKT1',   x: 240, y: 155, query: false },
    { id: 'YWHAZ',  x: 50,  y: 60,  query: false },
    { id: 'RAF1',   x: 55,  y: 150, query: false },
  ]
  const edges: [string, string, string][] = [
    ['BAD', 'BCL2',  edgeColors.literature],
    ['BAD', 'AKT1',  edgeColors.published],
    ['BAD', 'YWHAZ', edgeColors.validated],
    ['BAD', 'RAF1',  edgeColors.verified],
  ]

  return (
    <div
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        marginTop: 20,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--text-muted)',
          padding: '6px 10px',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        Network preview
      </div>
      <svg
        width="100%"
        height="200"
        viewBox="0 0 290 200"
        style={{ display: 'block', background: 'var(--bg)' }}
        aria-hidden="true"
      >
        {edges.map(([a, b, color], i) => {
          const na = nodes.find((n) => n.id === a)!
          const nb = nodes.find((n) => n.id === b)!
          return (
            <line
              key={i}
              x1={na.x} y1={na.y}
              x2={nb.x} y2={nb.y}
              stroke={color}
              strokeWidth="2"
              opacity="0.7"
            />
          )
        })}
        {nodes.map((n) => (
          <g key={n.id} transform={`translate(${n.x},${n.y})`}>
            <circle r={n.query ? 20 : 16} fill={n.query ? queryColor : interactorColor} />
            <text
              textAnchor="middle"
              dy=".35em"
              fontSize="9"
              fontFamily="var(--mono)"
              fontWeight="500"
              fill="#fff"
            >
              {n.id}
            </text>
          </g>
        ))}
      </svg>
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        {[
          { label: 'Query', color: queryColor },
          { label: 'Interactor', color: interactorColor },
        ].map(({ label, color }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
        {[
          { label: 'Published', color: edgeColors.published },
          { label: 'Validated', color: edgeColors.validated },
          { label: 'Verified', color: edgeColors.verified },
          { label: 'Literature', color: edgeColors.literature },
        ].map(({ label, color }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ width: 14, height: 2, background: color, display: 'inline-block', borderRadius: 1 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Logo upload
// ─────────────────────────────────────────────────────────
function LogoUploadSection({ currentLogoUrl }: { currentLogoUrl?: string | null }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const { mutate: upload, isPending: uploading } = useUploadLogo()
  const { mutate: removeLogo, isPending: removing } = useDeleteLogo()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ''
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        {/* Preview */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {currentLogoUrl ? (
            <img
              src={currentLogoUrl}
              alt="Site logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }}
            />
          ) : (
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
              <circle cx="16" cy="16" r="4" fill="#e11d48" opacity=".5" />
              <circle cx="5" cy="8" r="2.2" fill="#2563eb" opacity=".5" />
              <circle cx="27" cy="9" r="2.2" fill="#2563eb" opacity=".5" />
              <circle cx="6" cy="25" r="2.2" fill="#2563eb" opacity=".5" />
              <circle cx="26" cy="25" r="2.2" fill="#2563eb" opacity=".5" />
            </svg>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <button
              type="button"
              className="op-btn"
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : currentLogoUrl ? 'Replace logo' : 'Upload logo'}
            </button>
            {currentLogoUrl && (
              <button
                type="button"
                className="op-btn"
                style={{ padding: '6px 12px', fontSize: 12, color: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={() => removeLogo()}
                disabled={removing}
              >
                {removing ? 'Removing…' : 'Remove'}
              </button>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-soft)', margin: 0 }}>
            PNG, JPG, SVG, WebP · Displayed at 28px height in the nav. Use a square or wide format.
          </p>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Interaction category table
// ─────────────────────────────────────────────────────────
function CategoryTable() {
  const { data: categories = [], isLoading } = useInteractionCategories()
  const { mutate: createCat, isPending: creating } = useCreateCategory()
  const { mutate: updateCat } = useUpdateCategory()
  const { mutate: deleteCat } = useDeleteCategory()

  const [drafts, setDrafts] = useState<Record<number, Partial<InteractionCategory>>>({})
  const [newRow, setNewRow] = useState<Omit<InteractionCategory, 'id'>>({
    categoryName: '',
    order: '',
    colorScheme: '#2563eb',
    description: '',
  })

  const setDraft = (id: number, field: keyof InteractionCategory, value: string) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }))

  const getDraft = (cat: InteractionCategory, field: keyof InteractionCategory) =>
    (drafts[cat.id]?.[field] as string | undefined) ?? (cat[field] as string)

  if (isLoading) return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Name', 'Order', 'Color', 'Description', ''].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '6px 8px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontSize: 10,
                  letterSpacing: '.06em',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '6px 8px' }}>
                <input
                  className="op-input"
                  style={{ fontSize: 12, padding: '4px 8px' }}
                  value={getDraft(cat, 'categoryName')}
                  onChange={(e) => setDraft(cat.id, 'categoryName', e.target.value)}
                />
              </td>
              <td style={{ padding: '6px 8px', width: 60 }}>
                <input
                  className="op-input"
                  style={{ fontSize: 12, padding: '4px 8px' }}
                  value={getDraft(cat, 'order')}
                  onChange={(e) => setDraft(cat.id, 'order', e.target.value)}
                />
              </td>
              <td style={{ padding: '6px 8px', width: 60 }}>
                <input
                  type="color"
                  value={getDraft(cat, 'colorScheme')}
                  onChange={(e) => setDraft(cat.id, 'colorScheme', e.target.value)}
                  style={{ width: 36, height: 28, cursor: 'pointer', border: 'none', padding: 0, background: 'transparent' }}
                />
              </td>
              <td style={{ padding: '6px 8px' }}>
                <input
                  className="op-input"
                  style={{ fontSize: 12, padding: '4px 8px' }}
                  value={getDraft(cat, 'description')}
                  onChange={(e) => setDraft(cat.id, 'description', e.target.value)}
                />
              </td>
              <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                <button
                  type="button"
                  className="op-btn"
                  style={{ fontSize: 11, padding: '3px 10px', marginRight: 6 }}
                  onClick={() => updateCat({ id: cat.id, ...drafts[cat.id] })}
                >
                  Save
                </button>
                <button
                  type="button"
                  style={{
                    fontSize: 11,
                    padding: '3px 8px',
                    background: 'transparent',
                    border: '1px solid var(--danger)',
                    borderRadius: 6,
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font)',
                  }}
                  onClick={() => {
                    if (window.confirm(`Delete "${cat.categoryName}"?`)) deleteCat(cat.id)
                  }}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
          {/* New row */}
          <tr>
            <td style={{ padding: '6px 8px' }}>
              <input
                className="op-input"
                style={{ fontSize: 12, padding: '4px 8px' }}
                placeholder="Name"
                value={newRow.categoryName}
                onChange={(e) => setNewRow((r) => ({ ...r, categoryName: e.target.value }))}
              />
            </td>
            <td style={{ padding: '6px 8px' }}>
              <input
                className="op-input"
                style={{ fontSize: 12, padding: '4px 8px' }}
                placeholder="Order"
                value={newRow.order}
                onChange={(e) => setNewRow((r) => ({ ...r, order: e.target.value }))}
              />
            </td>
            <td style={{ padding: '6px 8px' }}>
              <input
                type="color"
                value={newRow.colorScheme}
                onChange={(e) => setNewRow((r) => ({ ...r, colorScheme: e.target.value }))}
                style={{ width: 36, height: 28, cursor: 'pointer', border: 'none', padding: 0, background: 'transparent' }}
              />
            </td>
            <td style={{ padding: '6px 8px' }}>
              <input
                className="op-input"
                style={{ fontSize: 12, padding: '4px 8px' }}
                placeholder="Description"
                value={newRow.description}
                onChange={(e) => setNewRow((r) => ({ ...r, description: e.target.value }))}
              />
            </td>
            <td style={{ padding: '6px 8px' }}>
              <button
                type="button"
                className="op-btn primary"
                style={{ fontSize: 11, padding: '3px 10px' }}
                disabled={creating || !newRow.categoryName}
                onClick={() => {
                  createCat(newRow)
                  setNewRow({ categoryName: '', order: '', colorScheme: '#2563eb', description: '' })
                }}
              >
                + Add
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Main form
// ─────────────────────────────────────────────────────────
function seedDefaults(s: AdminSettings): AdminSettings {
  // Null color fields mean "never saved" — seed with display defaults so
  // the first Save writes real values instead of null back to the DB.
  return {
    ...s,
    queryNodeColor:      s.queryNodeColor      ?? DEFAULT_COLORS.queryNodeColor!,
    interactorNodeColor: s.interactorNodeColor ?? DEFAULT_COLORS.interactorNodeColor!,
    publishedEdgeColor:  s.publishedEdgeColor  ?? DEFAULT_COLORS.publishedEdgeColor!,
    validatedEdgeColor:  s.validatedEdgeColor  ?? DEFAULT_COLORS.validatedEdgeColor!,
    verifiedEdgeColor:   s.verifiedEdgeColor   ?? DEFAULT_COLORS.verifiedEdgeColor!,
    literatureEdgeColor: s.literatureEdgeColor ?? DEFAULT_COLORS.literatureEdgeColor!,
    mainColorScheme:     s.mainColorScheme     ?? DEFAULT_COLORS.mainColorScheme!,
    headerColorScheme:   s.headerColorScheme   ?? DEFAULT_COLORS.headerColorScheme!,
  }
}

function SettingsForm({ initialSettings }: { initialSettings: AdminSettings }) {
  const { mutate: update, isPending, isSuccess, isError } = useUpdateSettings()
  const [form, setForm] = useState<AdminSettings>(() => seedDefaults(initialSettings))
  const [activeTab, setActiveTab] = useState<TabId>('global')

  const set = useCallback(<K extends keyof AdminSettings>(field: K, value: AdminSettings[K]) => {
    setForm((f) => ({ ...f, [field]: value }))
  }, [])

  // Live preview: apply CSS vars immediately as the admin adjusts any visual setting
  useEffect(() => {
    injectCSSVars(form)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.navStyle, form.mainColorScheme, form.mainColorScheme2, form.gradientAngle,
    form.headerColorScheme, form.logoColorScheme, form.buttonColorScheme,
    form.queryNodeColor, form.interactorNodeColor,
    form.publishedEdgeColor, form.validatedEdgeColor, form.verifiedEdgeColor, form.literatureEdgeColor,
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    update(form)
  }

  const handleResetColors = () => {
    if (!window.confirm('Reset all colors to defaults? Content (titles, footer, etc.) will not be changed.')) return
    setForm((f) => ({ ...f, ...DEFAULT_COLORS }))
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: '0 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 16px',
              fontSize: 13,
              fontWeight: 500,
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--primary)' : 'transparent'}`,
              cursor: 'pointer',
              marginBottom: -1,
              fontFamily: 'var(--font)',
              transition: 'color .15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── GLOBAL SETTINGS ── */}
      <TabPanel active={activeTab === 'global'}>
        <Section title="Site identity">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <FieldLabel>Site Title</FieldLabel>
              <TextInput value={form.title ?? ''} onChange={(v) => set('title', v)} />
            </div>
            <div>
              <FieldLabel>Short Title</FieldLabel>
              <TextInput value={form.shortTitle ?? ''} onChange={(v) => set('shortTitle', v)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <FieldLabel>Site URL</FieldLabel>
              <TextInput value={form.url ?? ''} onChange={(v) => set('url', v)} placeholder="https://…" />
            </div>
            <div>
              <FieldLabel>Version</FieldLabel>
              <TextInput value={form.version ?? ''} onChange={(v) => set('version', v)} placeholder="2.0" />
            </div>
          </div>
        </Section>

        <Section title="Logo">
          <LogoUploadSection currentLogoUrl={form.logoUrl} />
        </Section>

        <Section title="Footer">
          <FieldLabel>Footer HTML</FieldLabel>
          <RichTextEditor value={form.footer ?? ''} onChange={(v) => set('footer', v)} rows={3} />
        </Section>

        <Section title="Administration">
          <a
            href="/register"
            className="op-btn"
            style={{ textDecoration: 'none', display: 'inline-flex' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Register new admin
          </a>
        </Section>

        {/* Preset themes */}
        <Section title="Themes">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setForm((f) => ({ ...f, ...preset.colors }))}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: 'var(--surface)',
                  padding: 0,
                  textAlign: 'left',
                  transition: 'box-shadow .15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '' }}
              >
                <div style={{ height: 36, background: preset.preview }} />
                <div style={{ padding: '6px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
                  {preset.name}
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* Nav style */}
        <Section title="Navbar style">
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {(['solid', 'gradient', 'light'] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => set('navStyle', style)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 8,
                  border: `2px solid ${(form.navStyle ?? 'solid') === style ? 'var(--primary)' : 'var(--border)'}`,
                  background: (form.navStyle ?? 'solid') === style ? 'var(--primary-soft)' : 'var(--surface)',
                  color: (form.navStyle ?? 'solid') === style ? 'var(--primary-deep)' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  textTransform: 'capitalize',
                  transition: 'all .15s',
                }}
              >
                {style === 'solid'    && '◼ Solid'}
                {style === 'gradient' && '◐ Gradient'}
                {style === 'light'    && '◻ Light'}
              </button>
            ))}
          </div>

          {/* Colors — shown contextually */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ColorInput
              label={(form.navStyle ?? 'solid') === 'gradient' ? 'Gradient start' : 'Primary color'}
              value={form.mainColorScheme ?? '#2563eb'}
              onChange={(v) => set('mainColorScheme', v)}
            />
            {(form.navStyle ?? 'solid') === 'gradient' && (
              <ColorInput
                label="Gradient end"
                value={form.mainColorScheme2 ?? '#0ea5e9'}
                onChange={(v) => set('mainColorScheme2', v)}
              />
            )}
            {(form.navStyle ?? 'solid') !== 'light' && (
              <ColorInput
                label="Header text color"
                value={form.headerColorScheme ?? '#ffffff'}
                onChange={(v) => set('headerColorScheme', v)}
              />
            )}
            <ColorInput
              label="Logo color"
              value={form.logoColorScheme ?? '#ffffff'}
              onChange={(v) => set('logoColorScheme', v)}
            />
          </div>

          {/* Gradient angle slider */}
          {(form.navStyle ?? 'solid') === 'gradient' && (
            <div style={{ marginTop: 16 }}>
              <FieldLabel>Gradient angle</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={5}
                  value={form.gradientAngle ?? 135}
                  onChange={(e) => set('gradientAngle', parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--primary)' }}
                />
                <span className="op-num" style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 36 }}>
                  {form.gradientAngle ?? 135}°
                </span>
              </div>
            </div>
          )}
        </Section>

        {/* Buttons */}
        <Section title="Buttons &amp; accents">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ColorInput
              label="Button color"
              value={form.buttonColorScheme ?? '#2563eb'}
              onChange={(v) => set('buttonColorScheme', v)}
            />
          </div>
        </Section>

        {/* Live nav preview */}
        <NavPreview
          style={form.navStyle ?? 'solid'}
          main={form.mainColorScheme ?? '#2563eb'}
          main2={form.mainColorScheme2 ?? '#0ea5e9'}
          angle={form.gradientAngle ?? 135}
          header={form.navStyle === 'light' ? 'var(--text)' : (form.headerColorScheme ?? '#ffffff')}
        />
      </TabPanel>

      {/* ── HOME PAGE ── */}
      <TabPanel active={activeTab === 'home'}>
        <Section title="Top section">
          <div style={{ marginBottom: 16 }}>
            <FieldLabel>Top Section Title</FieldLabel>
            <TextInput value={form.missionTitle ?? ''} onChange={(v) => set('missionTitle', v)} placeholder="HTML allowed, e.g. <h4>Our Mission</h4>" />
          </div>
          <div>
            <FieldLabel>Top Section Text</FieldLabel>
            <RichTextEditor value={form.missionText ?? ''} onChange={(v) => set('missionText', v)} />
          </div>
        </Section>

        <Section title="Bottom section">
          <div style={{ marginBottom: 16 }}>
            <FieldLabel>Bottom Section Title</FieldLabel>
            <TextInput value={form.methodTitle ?? ''} onChange={(v) => set('methodTitle', v)} placeholder="HTML allowed, e.g. <h4>Methods</h4>" />
          </div>
          <div>
            <FieldLabel>Bottom Section Text</FieldLabel>
            <RichTextEditor value={form.methodText ?? ''} onChange={(v) => set('methodText', v)} />
          </div>
        </Section>
      </TabPanel>

      {/* ── SEARCH ── */}
      <TabPanel active={activeTab === 'search'}>
        <Section title="Search examples">
          {([1, 2, 3] as const).map((n) => {
            const proteinsKey = `example${n}` as 'example1' | 'example2' | 'example3'
            const typeKey = `example${n}Type` as 'example1Type' | 'example2Type' | 'example3Type'
            return (
              <div key={n} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <FieldLabel>Example {n}</FieldLabel>
                  <select
                    value={form[typeKey] ?? 'query-query'}
                    onChange={(e) => set(typeKey, e.target.value)}
                    style={{
                      fontSize: 12,
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: '1px solid var(--border-strong)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      fontFamily: 'var(--font)',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="query-query">query-query</option>
                    <option value="query-interactor">query-interactor</option>
                    <option value="all">all</option>
                  </select>
                </div>
                <TextareaInput
                  value={form[proteinsKey] ?? ''}
                  onChange={(v) => set(proteinsKey, v)}
                  rows={5}
                  mono
                />
                <p style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 4 }}>
                  One protein symbol per line.
                </p>
              </div>
            )
          })}
        </Section>

        <Section title="Node colors">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ColorInput label="Query Node Color"      value={form.queryNodeColor ?? '#e11d48'}      onChange={(v) => set('queryNodeColor', v)} />
            <ColorInput label="Interactor Node Color" value={form.interactorNodeColor ?? '#2563eb'} onChange={(v) => set('interactorNodeColor', v)} />
          </div>
        </Section>

        <Section title="Edge colors">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ColorInput label="Published Edge"  value={form.publishedEdgeColor ?? '#38761d'}  onChange={(v) => set('publishedEdgeColor', v)} />
            <ColorInput label="Validated Edge"  value={form.validatedEdgeColor ?? '#1155cc'}  onChange={(v) => set('validatedEdgeColor', v)} />
            <ColorInput label="Verified Edge"   value={form.verifiedEdgeColor ?? '#cc0000'}   onChange={(v) => set('verifiedEdgeColor', v)} />
            <ColorInput label="Literature Edge" value={form.literatureEdgeColor ?? '#ff9900'} onChange={(v) => set('literatureEdgeColor', v)} />
          </div>
        </Section>

        <NetworkPreview
          queryColor={form.queryNodeColor ?? '#e11d48'}
          interactorColor={form.interactorNodeColor ?? '#2563eb'}
          edgeColors={{
            published: form.publishedEdgeColor ?? '#38761d',
            validated: form.validatedEdgeColor ?? '#1155cc',
            verified: form.verifiedEdgeColor ?? '#cc0000',
            literature: form.literatureEdgeColor ?? '#ff9900',
          }}
        />

        <Section title="Interaction categories">
          <p style={{ fontSize: 12, color: 'var(--text-soft)', marginBottom: 12 }}>
            Each row controls how an interaction source is displayed in search results.
          </p>
          <CategoryTable />
        </Section>
      </TabPanel>

      {/* Footer bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 32px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}
      >
        <button
          type="submit"
          disabled={isPending}
          className="op-btn primary"
          style={{ padding: '9px 20px' }}
        >
          {isPending ? 'Saving…' : 'Save Settings'}
        </button>
        <button
          type="button"
          className="op-btn"
          onClick={handleResetColors}
          title="Reset all colors to their defaults"
        >
          Reset colors
        </button>
        {isSuccess && (
          <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>
            ✓ Settings saved
          </span>
        )}
        {isError && (
          <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 500 }}>
            ✗ Save failed — check that you are logged in as an admin
          </span>
        )}
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────
// Page shell
// ─────────────────────────────────────────────────────────
export function AdminSettingsPage() {
  const { data: settings, isLoading } = useSettings()

  if (isLoading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading settings...
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: '40px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '-.02em',
            margin: '0 0 24px',
            color: 'var(--text)',
          }}
        >
          Site Settings
        </h1>
        {settings && (
          <div className="op-card" style={{ overflow: 'hidden' }}>
            <SettingsForm initialSettings={settings} />
          </div>
        )}
      </div>
    </div>
  )
}
