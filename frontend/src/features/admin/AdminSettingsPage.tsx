import { useState, useCallback, useRef } from 'react'
import { useSettings, useUpdateSettings, useUploadLogo, useDeleteLogo } from '../../api/settings'
import type { AdminSettings } from '../../types/api'

// ─────────────────────────────────────────────────────────
// Field metadata
// ─────────────────────────────────────────────────────────
type TabId = 'general' | 'appearance' | 'home' | 'network'

const TABS: { id: TabId; label: string }[] = [
  { id: 'general',    label: 'General' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'home',       label: 'Home Content' },
  { id: 'network',    label: 'Network Colors' },
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
function NavPreview({ main, header }: { main: string; header: string }) {
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
        Preview
      </div>
      <div
        style={{
          background: main,
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <span style={{ color: header, fontWeight: 600, fontSize: 14 }}>openPIP</span>
        {['Home', 'Search', 'Downloads', 'About'].map((l) => (
          <span key={l} style={{ color: header, opacity: 0.75, fontSize: 13 }}>
            {l}
          </span>
        ))}
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
// Main form
// ─────────────────────────────────────────────────────────
function SettingsForm({ initialSettings }: { initialSettings: AdminSettings }) {
  const { mutate: update, isPending, isSuccess } = useUpdateSettings()
  const [form, setForm] = useState<AdminSettings>(initialSettings)
  const [activeTab, setActiveTab] = useState<TabId>('general')

  const set = useCallback(<K extends keyof AdminSettings>(field: K, value: AdminSettings[K]) => {
    setForm((f) => ({ ...f, [field]: value }))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    update(form)
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

      {/* ── GENERAL ── */}
      <TabPanel active={activeTab === 'general'}>
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
          <TextareaInput value={form.footer ?? ''} onChange={(v) => set('footer', v)} rows={3} mono />
          <p style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 6 }}>
            Rendered as raw HTML. Use inline styles for formatting.
          </p>
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
      </TabPanel>

      {/* ── APPEARANCE ── */}
      <TabPanel active={activeTab === 'appearance'}>
        <Section title="Site colors">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ColorInput label="Primary Color"  value={form.mainColorScheme ?? '#2563eb'}   onChange={(v) => set('mainColorScheme', v)} />
            <ColorInput label="Header Color"   value={form.headerColorScheme ?? '#ffffff'}  onChange={(v) => set('headerColorScheme', v)} />
            <ColorInput label="Logo Color"     value={form.logoColorScheme ?? '#ffffff'}    onChange={(v) => set('logoColorScheme', v)} />
            <ColorInput label="Button Color"   value={form.buttonColorScheme ?? '#2563eb'}  onChange={(v) => set('buttonColorScheme', v)} />
          </div>
          <NavPreview main={form.mainColorScheme ?? '#2563eb'} header={form.headerColorScheme ?? '#ffffff'} />
        </Section>
      </TabPanel>

      {/* ── HOME CONTENT ── */}
      <TabPanel active={activeTab === 'home'}>
        <Section title="Top section">
          <div style={{ marginBottom: 16 }}>
            <FieldLabel>Mission Title</FieldLabel>
            <TextInput value={form.missionTitle ?? ''} onChange={(v) => set('missionTitle', v)} placeholder="HTML allowed, e.g. <h4>Our Mission</h4>" />
          </div>
          <div>
            <FieldLabel>Mission Text</FieldLabel>
            <TextareaInput value={form.missionText ?? ''} onChange={(v) => set('missionText', v)} rows={5} />
          </div>
        </Section>

        <Section title="Bottom section">
          <div style={{ marginBottom: 16 }}>
            <FieldLabel>Method Title</FieldLabel>
            <TextInput value={form.methodTitle ?? ''} onChange={(v) => set('methodTitle', v)} placeholder="HTML allowed, e.g. <h4>Methods</h4>" />
          </div>
          <div>
            <FieldLabel>Method Text</FieldLabel>
            <TextareaInput value={form.methodText ?? ''} onChange={(v) => set('methodText', v)} rows={5} />
          </div>
        </Section>
      </TabPanel>

      {/* ── NETWORK COLORS ── */}
      <TabPanel active={activeTab === 'network'}>
        <Section title="Node colors">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ColorInput label="Query Node Color"      value={form.queryNodeColor ?? '#e11d48'}      onChange={(v) => set('queryNodeColor', v)} />
            <ColorInput label="Interactor Node Color" value={form.interactorNodeColor ?? '#2563eb'} onChange={(v) => set('interactorNodeColor', v)} />
          </div>
        </Section>

        <Section title="Edge colors">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ColorInput label="Published Edge"   value={form.publishedEdgeColor ?? '#38761d'}  onChange={(v) => set('publishedEdgeColor', v)} />
            <ColorInput label="Validated Edge"   value={form.validatedEdgeColor ?? '#1155cc'}  onChange={(v) => set('validatedEdgeColor', v)} />
            <ColorInput label="Verified Edge"    value={form.verifiedEdgeColor ?? '#cc0000'}   onChange={(v) => set('verifiedEdgeColor', v)} />
            <ColorInput label="Literature Edge"  value={form.literatureEdgeColor ?? '#ff9900'} onChange={(v) => set('literatureEdgeColor', v)} />
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
      </TabPanel>

      {/* Footer bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
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
        {isSuccess && (
          <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>
            ✓ Settings saved
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
