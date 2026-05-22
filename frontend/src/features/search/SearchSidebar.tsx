import { useState, type CSSProperties } from 'react'
import { buildLinks } from './externalLinks'
import { useNavigate } from 'react-router-dom'
import { useSearchStore } from './searchStore'
import { useAuthStore } from '../../store/authStore'
import { useSaveNetwork } from '../../api/networks'
import {
  formatSIF,
  formatInteractionsCSV,
  formatInteractorsCSV,
  formatFASTA,
  formatPSIMI,
  buildFilename,
  downloadFile,
} from '../../lib/download'

const CATEGORY_COLORS: Record<string, string> = {
  Published: 'var(--hi-union)',
  Validated: 'var(--huri-lit)',
  Verified: 'var(--color-edge-verified)',
  Literature: 'var(--literature)',
}

const EXAMPLE_GENES = ['BAD', 'TP53', 'BRCA1', 'AKT1']

const TISSUES = [
  'Adipose Subcutaneous', 'Adrenal Gland', 'Artery Aorta',
  'Brain Basal Ganglia', 'Brain Cerebellum', 'Brain Cortex',
  'Breast Mammary Tissue', 'Colon Sigmoid', 'Heart Left Ventricle',
  'Kidney Cortex', 'Liver', 'Lung', 'Muscle Skeletal', 'Ovary',
  'Pancreas', 'Prostate', 'Skin Sun Exposed', 'Spleen', 'Stomach',
  'Testis', 'Thyroid', 'Uterus', 'Whole Blood',
]

type LayoutName = 'cola' | 'cose' | 'concentric' | 'circle' | 'grid'

const LAYOUT_OPTIONS: { value: LayoutName; label: string; icon: string }[] = [
  { value: 'cola',       label: 'Force-directed (Cola)', icon: '/cola_layout.png' },
  { value: 'cose',       label: 'Force-directed (CoSE)', icon: '/cose_layout.png' },
  { value: 'concentric', label: 'Concentric',            icon: '/concentric_layout.png' },
  { value: 'circle',     label: 'Circle',                icon: '/circle_layout.png' },
  { value: 'grid',       label: 'Grid',                  icon: '/grid_layout.png' },
]

const FILTER_MODE_OPTIONS: { label: string; value: 'None' | 'query_query' | 'query_interactor' }[] = [
  { label: 'None', value: 'None' },
  { label: 'Query-Query', value: 'query_query' },
  { label: 'Query-Interactor', value: 'query_interactor' },
]

interface SearchSidebarProps {
  term: string
  visibleInteractionIds: number[]
}

const sectionLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--text-soft)',
  textTransform: 'uppercase',
  letterSpacing: '.09em',
  display: 'block',
  marginBottom: 8,
}

function SidebarAccordion({ label, children, defaultOpen = true }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '4px 0',
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-soft)',
          textTransform: 'uppercase',
          letterSpacing: '.09em',
        }}
      >
        <span>{label}</span>
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div style={{ paddingTop: 6, paddingBottom: 4 }}>
          {children}
        </div>
      )}
    </div>
  )
}

export function SearchSidebar({ term, visibleInteractionIds }: SearchSidebarProps) {
  const navigate = useNavigate()
  const [localQuery, setLocalQuery] = useState(term)

  const scoreFilter = useSearchStore((s) => s.scoreFilter)
  const categoryFilter = useSearchStore((s) => s.categoryFilter)
  const filterMode = useSearchStore((s) => s.filterMode)
  const selectedLayout = useSearchStore((s) => s.selectedLayout)
  const allProteins = useSearchStore((s) => s.allProteins)
  const queryProteinIds = useSearchStore((s) => s.queryProteinIds)
  const allInteractions = useSearchStore((s) => s.allInteractions)
  const foundSummary = useSearchStore((s) => s.foundSummary)
  const unfoundSummary = useSearchStore((s) => s.unfoundSummary)
  const setScoreFilter = useSearchStore((s) => s.setScoreFilter)
  const setCategoryFilter = useSearchStore((s) => s.setCategoryFilter)
  const setFilterMode = useSearchStore((s) => s.setFilterMode)
  const setLayout = useSearchStore((s) => s.setLayout)
  const setModal = useSearchStore((s) => s.setModal)

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const { mutateAsync: saveNetwork, isPending: isSaving } = useSaveNetwork()
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState(term)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  async function handleSaveNetwork() {
    setSaveError('')
    if (!saveName.trim()) {
      setSaveError('Name is required')
      return
    }
    try {
      const activeCategories = Object.entries(categoryFilter)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(',')
      await saveNetwork({
        name: saveName.trim(),
        query: term,
        score_parameter: scoreFilter.toFixed(2),
        category_array: activeCategories,
        tissue_expression_array: '',
        interaction_ids: visibleInteractionIds,
      })
      setSaveSuccess(true)
      setTimeout(() => {
        setSaveOpen(false)
        setSaveName(term)
        setSaveSuccess(false)
      }, 1500)
    } catch {
      setSaveError('Failed to save. Try again.')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = localQuery.trim()
    if (q) navigate(`/search/${encodeURIComponent(q)}`)
  }

  function handleDownload(content: string, format: string, ext: string) {
    downloadFile(buildFilename(format, ext), content)
  }

  const hasCategories = Object.keys(categoryFilter).length > 0

  const lockIcon = !isLoggedIn ? ' 🔒' : ''

  const downloadActions: { label: string; onClick: () => void }[] = isLoggedIn
    ? [
        { label: 'SIF', onClick: () => handleDownload(formatSIF(allInteractions, allProteins), 'SIF', 'sif') },
        { label: 'Interactions CSV', onClick: () => handleDownload(formatInteractionsCSV(allInteractions, allProteins), 'Interactions', 'csv') },
        { label: 'Interactors CSV', onClick: () => handleDownload(formatInteractorsCSV(allProteins), 'Interactors', 'csv') },
        { label: 'FASTA', onClick: () => handleDownload(formatFASTA(allProteins), 'FASTA', 'fasta') },
        { label: 'PSI-MI', onClick: () => handleDownload(formatPSIMI(allInteractions, allProteins), 'PSIMI', 'tsv') },
        { label: 'Direct Download (GZ)', onClick: () => setModal('directDownload') },
      ]
    : [
        { label: `SIF${lockIcon}`, onClick: () => setModal('downloadAuth') },
        { label: `Interactions CSV${lockIcon}`, onClick: () => setModal('downloadAuth') },
        { label: `Interactors CSV${lockIcon}`, onClick: () => setModal('downloadAuth') },
        { label: `FASTA${lockIcon}`, onClick: () => setModal('downloadAuth') },
        { label: `PSI-MI${lockIcon}`, onClick: () => setModal('downloadAuth') },
        { label: `Direct Download (GZ)${lockIcon}`, onClick: () => setModal('downloadAuth') },
      ]

  return (
    <aside style={{
      width: 272,
      flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      padding: '20px 16px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    }}>

      {/* Query */}
      <div>
        <label style={sectionLabelStyle}>Query</label>
        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative' }}>
            <input
              className="op-input"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Gene symbol or UniProt ID"
              style={{ paddingLeft: 32, fontFamily: 'var(--mono)', fontSize: 13 }}
            />
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-muted)" strokeWidth="2"
              style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </div>
          <button
            type="submit"
            className="op-btn primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 13, padding: '8px' }}
          >
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
          {EXAMPLE_GENES.map((g) => (
            <button
              key={g}
              onClick={() => navigate(`/search/${encodeURIComponent(g)}`)}
              className="op-chip"
              style={{
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                background: term === g ? 'var(--primary-soft)' : undefined,
                color: term === g ? 'var(--primary-deep)' : undefined,
                borderColor: term === g ? 'transparent' : undefined,
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Confidence score */}
      <div>
        <label style={sectionLabelStyle}>Min. confidence score</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={scoreFilter}
            onChange={(e) => setScoreFilter(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
          <span className="op-num" style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 28, textAlign: 'right' }}>
            {scoreFilter.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Found / not found */}
      {foundSummary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>Found: </span>
            <span dangerouslySetInnerHTML={{ __html: foundSummary }} />
          </div>
          {unfoundSummary && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 600, color: 'var(--warn)' }}>Not found: </span>
              {unfoundSummary}
            </div>
          )}
        </div>
      )}

      {/* Interaction sources */}
      {hasCategories && (
        <div>
          <label style={sectionLabelStyle}>Interaction sources</label>
          {Object.entries(categoryFilter).map(([name, checked]) => (
            <label
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '6px 0',
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--text)',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setCategoryFilter(name, e.target.checked)}
                style={{ accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }}
              />
              <span style={{
                width: 12,
                height: 3,
                borderRadius: 2,
                background: CATEGORY_COLORS[name] ?? 'var(--text-muted)',
                flexShrink: 0,
              }} />
              {name}
            </label>
          ))}
        </div>
      )}

      {/* Tool sections — only shown once a search has been performed */}
      {term && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={sectionLabelStyle}>Tools</span>

          <SidebarAccordion label="Layout">
            {LAYOUT_OPTIONS.map(({ value, label, icon }) => (
              <label
                key={value}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}
              >
                <input
                  type="radio"
                  name="sidebarLayout"
                  value={value}
                  checked={selectedLayout === value}
                  onChange={() => setLayout(value)}
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <img src={icon} alt="" width={18} height={18} style={{ flexShrink: 0, opacity: 0.75 }} />
                {label}
              </label>
            ))}
          </SidebarAccordion>

          <SidebarAccordion label="Filter mode">
            {FILTER_MODE_OPTIONS.map(({ label, value }) => (
              <label
                key={value}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}
              >
                <input
                  type="radio"
                  name="sidebarFilterMode"
                  value={value}
                  checked={filterMode === value}
                  onChange={() => setFilterMode(value)}
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                {label}
              </label>
            ))}
          </SidebarAccordion>

          <SidebarAccordion label="Summary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>Proteins: </span>
                <span style={{ color: 'var(--text-muted)' }}>{allProteins.length}</span>
              </div>
              <div>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>Interactions: </span>
                <span style={{ color: 'var(--text-muted)' }}>{allInteractions.length}</span>
              </div>
              <div>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>Avg. node degree: </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {allProteins.length > 0
                    ? ((2 * allInteractions.length) / allProteins.length).toFixed(2)
                    : '—'}
                </span>
              </div>
            </div>
          </SidebarAccordion>

          <SidebarAccordion label="Download" defaultOpen={false}>
            {downloadActions.map(({ label, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '6px 4px',
                  fontSize: 13,
                  color: 'var(--text)',
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                {label}
              </button>
            ))}
          </SidebarAccordion>

          <SidebarAccordion label="External links" defaultOpen={false}>
            {allProteins.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No proteins loaded.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {buildLinks(allProteins, queryProteinIds).map((link) =>
                  link.href ? (
                    <a
                      key={link.id}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: 'var(--primary)' }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => link.onClick?.()}
                      style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                    >
                      {link.label}
                    </button>
                  )
                )}
              </div>
            )}
          </SidebarAccordion>

          {isLoggedIn && (
            <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)', marginTop: 4 }}>
              {!saveOpen ? (
                <button
                  type="button"
                  onClick={() => { setSaveOpen(true); setSaveName(term) }}
                  className="op-btn"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '7px' }}
                >
                  Save Network
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    className="op-input"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Network name"
                    style={{ fontSize: 12 }}
                    autoFocus
                  />
                  {saveError && (
                    <div style={{ fontSize: 11, color: 'var(--warn)' }}>{saveError}</div>
                  )}
                  {saveSuccess && (
                    <div style={{ fontSize: 11, color: 'var(--success, #22c55e)' }}>Saved!</div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => { setSaveOpen(false); setSaveError(''); setSaveSuccess(false) }}
                      className="op-btn"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '6px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNetwork}
                      disabled={isSaving || visibleInteractionIds.length === 0}
                      className="op-btn primary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '6px' }}
                    >
                      {isSaving ? '…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tissue expression */}
      <div>
        <label style={sectionLabelStyle}>Tissue expression</label>
        <select
          className="op-input"
          defaultValue=""
          disabled
          title="Tissue filtering coming in Phase 2"
          style={{ fontSize: 13, opacity: 0.5, cursor: "not-allowed" }}
        >
          <option value="">All tissues</option>
          {TISSUES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
    </aside>
  )
}
