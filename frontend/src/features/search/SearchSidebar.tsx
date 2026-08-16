import { useState, type CSSProperties } from 'react'
import { buildLinks } from './externalLinks'
import { useNavigate } from 'react-router-dom'
import { useGeneAutocomplete } from '../../components/useGeneAutocomplete'
import { GeneSuggestionList } from '../../components/GeneSuggestionList'
import { useSearchStore } from './searchStore'
import { useAuthStore } from '../../store/authStore'
import { useSettings } from '../../api/settings'
import { useSaveNetwork } from '../../api/networks'
import { useText } from '../../text'
import { normalizeExampleType, toFilterMode } from '../../lib/exampleType'
import { TISSUE_KEYS, tissueLabel } from '../../lib/tissues'
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

type LayoutName = 'cola' | 'cose' | 'concentric' | 'circle' | 'grid'

function LayoutIcon({ value }: { value: LayoutName }) {
  const s = { flexShrink: 0 as const }
  if (value === 'cola') return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" style={s} aria-hidden="true">
      <circle cx="9" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="3" cy="13" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <line x1="9" y1="5.5" x2="9" y2="8.5" />
      <line x1="9" y1="11.5" x2="4.2" y2="12.3" />
      <line x1="9" y1="11.5" x2="13.8" y2="12.3" />
      <line x1="9" y1="5.5" x2="3.5" y2="11.8" />
    </svg>
  )
  if (value === 'cose') return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" style={s} aria-hidden="true">
      <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="3" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="14" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <line x1="9" y1="9" x2="3.8" y2="5.2" />
      <line x1="9" y1="9" x2="14.2" y2="6" />
      <line x1="9" y1="9" x2="4.8" y2="13" />
      <line x1="9" y1="9" x2="13.2" y2="13" />
      <line x1="3.8" y1="5.2" x2="14.2" y2="6" />
    </svg>
  )
  if (value === 'concentric') return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" style={s} aria-hidden="true">
      <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="9" r="4.5" />
      <circle cx="9" cy="9" r="7.5" />
      <circle cx="9" cy="4.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="9" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="9" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
  if (value === 'circle') return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" style={s} aria-hidden="true">
      <circle cx="9" cy="2" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="5.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="12.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="16" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="2.8" cy="12.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="2.8" cy="5.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="9" r="6.5" strokeDasharray="2 2" />
    </svg>
  )
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" style={s} aria-hidden="true">
      <circle cx="4" cy="4" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="4" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="14" cy="4" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4" cy="9" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="9" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="14" cy="9" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4" cy="14" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="14" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="14" cy="14" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

const LAYOUT_OPTIONS: { value: LayoutName; textKey: string }[] = [
  { value: 'cola',       textKey: 'search.layout.cola'       },
  { value: 'cose',       textKey: 'search.layout.cose'       },
  { value: 'concentric', textKey: 'search.layout.concentric' },
  { value: 'circle',     textKey: 'search.layout.circle'     },
  { value: 'grid',       textKey: 'search.layout.grid'       },
]

const FILTER_MODE_OPTIONS: { textKey: string; value: 'None' | 'query_query' | 'query_interactor' }[] = [
  { textKey: 'search.filterMode.none', value: 'None' },
  { textKey: 'search.filterMode.queryQuery', value: 'query_query' },
  { textKey: 'search.filterMode.queryInteractor', value: 'query_interactor' },
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
  const ac = useGeneAutocomplete(localQuery, setLocalQuery, 'sidebar-gene')
  const t = useText()

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
  const tissueFilter = useSearchStore((s) => s.tissueFilter)
  const setFilterMode = useSearchStore((s) => s.setFilterMode)
  const setTissueFilter = useSearchStore((s) => s.setTissueFilter)
  const setLayout = useSearchStore((s) => s.setLayout)
  const setModal = useSearchStore((s) => s.setModal)

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const { data: settings } = useSettings()
  const searchExamples = [
    { proteins: settings?.example1, type: settings?.example1Type },
    { proteins: settings?.example2, type: settings?.example2Type },
    { proteins: settings?.example3, type: settings?.example3Type },
  ].filter((ex) => ex.proteins?.trim())

  const { mutateAsync: saveNetwork, isPending: isSaving } = useSaveNetwork()
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState(term)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  async function handleSaveNetwork() {
    setSaveError('')
    if (!saveName.trim()) {
      setSaveError(t('search.save.nameRequired'))
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
      setSaveError(t('search.save.failed'))
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

  const downloadActions: { label: string; onClick: () => void }[] = [
    { label: t('search.download.sif'), onClick: () => handleDownload(formatSIF(allInteractions, allProteins), 'SIF', 'sif') },
    { label: t('search.download.interactionsCsv'), onClick: () => handleDownload(formatInteractionsCSV(allInteractions, allProteins), 'Interactions', 'csv') },
    { label: t('search.download.interactorsCsv'), onClick: () => handleDownload(formatInteractorsCSV(allProteins), 'Interactors', 'csv') },
    { label: t('search.download.fasta'), onClick: () => handleDownload(formatFASTA(allProteins), 'FASTA', 'fasta') },
    { label: t('search.download.psimi'), onClick: () => handleDownload(formatPSIMI(allInteractions, allProteins), 'PSIMI', 'tsv') },
    { label: t('search.download.direct'), onClick: () => setModal('directDownload') },
    { label: t('search.download.cytoscape'), onClick: () => setModal('cyRest') },
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
        <label style={sectionLabelStyle}>{t('search.sidebar.query')}</label>
        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative' }}>
            <input
              className="op-input"
              value={localQuery}
              {...ac.inputProps}
              placeholder={t('search.sidebar.queryPlaceholder')}
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
            {ac.showList && (
              <GeneSuggestionList
                idPrefix="sidebar-gene"
                suggestions={ac.suggestions}
                activeIndex={ac.activeIndex}
                setActiveIndex={ac.setActiveIndex}
                onSelect={ac.selectSuggestion}
              />
            )}
          </div>
          <button
            type="submit"
            className="op-btn primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 13, padding: '8px' }}
          >
            {t('search.sidebar.searchButton')}
          </button>
        </form>

        {searchExamples.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', opacity: 0.55, textTransform: 'uppercase', paddingBottom: 2 }}>
              {t('search.sidebar.examples')}
            </span>
            {searchExamples.map((ex, i) => {
              const genes = (ex.proteins ?? '').split('\n').map((g) => g.trim()).filter(Boolean)
              const preview = genes.slice(0, 2).join(', ') + (genes.length > 2 ? '…' : '')
              const query = genes.join(',')
              const typeLabel = normalizeExampleType(ex.type)
              return (
                <button
                  key={i}
                  onClick={() => {
                    setFilterMode(toFilterMode(ex.type))
                    navigate(`/search/${encodeURIComponent(query)}`)
                  }}
                  className="op-chip"
                  style={{
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={genes.join(', ')}
                >
                  {preview} · {typeLabel}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Confidence score */}
      <div>
        <label style={sectionLabelStyle}>{t('search.sidebar.score')}</label>
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
      {(foundSummary || unfoundSummary) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {foundSummary && (
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 600, color: '#16a34a' }}>{t('search.sidebar.found')} </span>
              <span style={{ color: '#16a34a' }}>{foundSummary.split('<br>').join(', ')}</span>
            </div>
          )}
          {unfoundSummary && (
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 600, color: '#e11d48' }}>{t('search.sidebar.notFound')} </span>
              <span style={{ color: '#e11d48' }}>{unfoundSummary.split('<br>').join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Interaction sources */}
      {hasCategories && (
        <div>
          <label style={sectionLabelStyle}>{t('search.sidebar.sources')}</label>
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

      {/* Tool sections - only shown once a search has been performed */}
      {term && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={sectionLabelStyle}>{t('search.sidebar.tools')}</span>

          <SidebarAccordion label={t('search.sidebar.layout')}>
            {LAYOUT_OPTIONS.map(({ value, textKey }) => (
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
                <LayoutIcon value={value} />
                {t(textKey)}
              </label>
            ))}
          </SidebarAccordion>

          <SidebarAccordion label={t('search.sidebar.filterMode')}>
            {FILTER_MODE_OPTIONS.map(({ textKey, value }) => (
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
                {t(textKey)}
              </label>
            ))}
          </SidebarAccordion>

          {/* Tissue expression */}
          <div>
            <label htmlFor="tissue-filter" style={sectionLabelStyle}>{t('search.sidebar.tissue')}</label>
            <select
              id="tissue-filter"
              className="op-input"
              value={tissueFilter}
              onChange={(e) => setTissueFilter(e.target.value)}
              style={{ fontSize: 13 }}
            >
              <option value="">{t('search.sidebar.allTissues')}</option>
              {TISSUE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {tissueLabel(key)}
                </option>
              ))}
            </select>
          </div>

          <SidebarAccordion label={t('search.sidebar.summary')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{t('search.summary.proteins')} </span>
                <span style={{ color: 'var(--text-muted)' }}>{allProteins.length}</span>
              </div>
              <div>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{t('search.summary.interactions')} </span>
                <span style={{ color: 'var(--text-muted)' }}>{allInteractions.length}</span>
              </div>
              <div>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{t('search.summary.avgDegree')} </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {allProteins.length > 0
                    ? ((2 * allInteractions.length) / allProteins.length).toFixed(2)
                    : '-'}
                </span>
              </div>
            </div>
          </SidebarAccordion>

          <SidebarAccordion label={t('search.sidebar.download')} defaultOpen={false}>
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

          <SidebarAccordion label={t('search.sidebar.externalLinks')} defaultOpen={false}>
            {allProteins.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('search.sidebar.noProteins')}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {buildLinks(allProteins, queryProteinIds).map((link) =>
                  link.href ? (
                    <a
                      key={link.id}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: 'var(--accent)' }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => link.onClick?.()}
                      style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
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
                  {t('search.save.button')}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    className="op-input"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder={t('search.save.placeholder')}
                    style={{ fontSize: 12 }}
                    autoFocus
                  />
                  {saveError && (
                    <div style={{ fontSize: 11, color: 'var(--warn)' }}>{saveError}</div>
                  )}
                  {saveSuccess && (
                    <div style={{ fontSize: 11, color: 'var(--success, #22c55e)' }}>{t('search.save.success')}</div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => { setSaveOpen(false); setSaveError(''); setSaveSuccess(false) }}
                      className="op-btn"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '6px' }}
                    >
                      {t('search.save.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNetwork}
                      disabled={isSaving || visibleInteractionIds.length === 0}
                      className="op-btn primary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '6px' }}
                    >
                      {isSaving ? '…' : t('search.save.confirm')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </aside>
  )
}
