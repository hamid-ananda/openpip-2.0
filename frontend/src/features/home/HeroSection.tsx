import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatsCounter } from './StatsCounter'
import { MiniNetworkGraph } from './MiniNetworkGraph'
import { useSettings } from '../../api/settings'
import { useAutocomplete } from '../../api/proteins'
import { useSearchStore } from '../search/searchStore'

interface HeroSectionProps {
  shortTitle: string
  proteins: number
  interactions: number
  datasets: number
}

function toFilterMode(type: string | undefined): 'None' | 'query_query' | 'query_interactor' {
  if (type === 'query-query') return 'query_query'
  if (type === 'query-interactor') return 'query_interactor'
  return 'None'
}

export function HeroSection({ shortTitle, proteins, interactions, datasets }: HeroSectionProps) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { data: settings } = useSettings()
  const setFilterMode = useSearchStore((s) => s.setFilterMode)

  const searchExamples = [
    { proteins: settings?.example1, type: settings?.example1Type },
    { proteins: settings?.example2, type: settings?.example2Type },
    { proteins: settings?.example3, type: settings?.example3Type },
  ].filter((ex) => ex.proteins?.trim())

  // The query may hold several comma-separated genes; autocomplete the token the
  // user is currently typing (the part after the last comma).
  const tokens = query.split(',')
  const activeToken = (tokens[tokens.length - 1] ?? '').trim()
  const chosen = tokens.slice(0, -1).map((t) => t.trim().toLowerCase())
  const { data: rawSuggestions = [] } = useAutocomplete(activeToken)
  const suggestions = rawSuggestions.filter((s) => !chosen.includes(s.toLowerCase()))
  const showList = showSuggestions && activeToken.length >= 2 && suggestions.length > 0

  const selectSuggestion = (value: string) => {
    const head = tokens
      .slice(0, -1)
      .map((t) => t.trim())
      .filter(Boolean)
    setQuery([...head, value].join(', '))
    setShowSuggestions(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveIndex(-1)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = query.trim()
    if (term) navigate(`/search/${encodeURIComponent(term)}`)
  }

  return (
    <section style={{ background: 'var(--bg)', padding: '64px 80px 48px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: 64,
          alignItems: 'center',
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        {/* Left: copy + search */}
        <div className="animate-fade-up">
          <div className="op-chip primary" style={{ marginBottom: 20 }}>
            ●&nbsp;<span>{shortTitle || 'openPIP'}</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 4vw, 56px)',
              lineHeight: 1.05,
              letterSpacing: '-.03em',
              margin: '0 0 20px',
              fontWeight: 600,
              color: 'var(--text)',
            }}
          >
            The protein{' '}
            <span style={{ color: 'var(--primary)' }}>interaction network</span>,
            <br />
            made queryable.
          </h1>

          <p
            style={{
              fontSize: 17,
              color: 'var(--text-muted)',
              lineHeight: 1.55,
              margin: '0 0 28px',
              maxWidth: 540,
            }}
          >
            Search proteins across verified interactions from the CCSB Human
            Interactome, visualized, filterable, and ready to export.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', marginBottom: 36 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setShowSuggestions(true)
                  setActiveIndex(-1)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
                onKeyDown={handleKeyDown}
                placeholder="Search by gene names, e.g. BAD, BCL2L1"
                className="op-input"
                style={{ borderRadius: '8px 0 0 8px', borderRight: 'none', width: '100%' }}
                aria-label="Search proteins and interactions"
                role="combobox"
                aria-expanded={showList}
                aria-autocomplete="list"
                aria-controls="gene-autocomplete-list"
                aria-activedescendant={activeIndex >= 0 ? `gene-suggestion-${activeIndex}` : undefined}
              />
              {showList && (
                <ul
                  id="gene-autocomplete-list"
                  role="listbox"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    margin: 0,
                    padding: 4,
                    listStyle: 'none',
                    background: 'var(--surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 20,
                    maxHeight: 260,
                    overflowY: 'auto',
                  }}
                >
                  {suggestions.map((s, i) => (
                    <li
                      key={s}
                      id={`gene-suggestion-${i}`}
                      role="option"
                      aria-selected={i === activeIndex}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        selectSuggestion(s)
                      }}
                      onMouseEnter={() => setActiveIndex(i)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 6,
                        fontSize: 14,
                        fontFamily: 'var(--mono)',
                        cursor: 'pointer',
                        color: 'var(--text)',
                        background: i === activeIndex ? 'var(--primary-soft)' : 'transparent',
                      }}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="submit"
              className="op-btn primary"
              style={{
                borderRadius: '0 8px 8px 0',
                whiteSpace: 'nowrap',
                padding: '9px 22px',
                fontSize: 14,
              }}
            >
              Search
            </button>
          </form>

          {searchExamples.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-soft)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Try:</span>
              {searchExamples.map((ex, i) => {
                const genes = (ex.proteins ?? '').split('\n').map((g) => g.trim()).filter(Boolean)
                const preview = genes.slice(0, 2).join(', ') + (genes.length > 2 ? '…' : '')
                const query = genes.join(',')
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setFilterMode(toFilterMode(ex.type))
                      navigate(`/search/${encodeURIComponent(query)}`)
                    }}
                    style={{
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)',
                      fontSize: 13,
                      fontWeight: 500,
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: '1.5px solid var(--border-strong)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      transition: 'border-color .15s, background .15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)'
                      e.currentTarget.style.background = 'var(--primary-soft)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-strong)'
                      e.currentTarget.style.background = 'var(--surface)'
                    }}
                  >
                    {preview}
                    <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>
                      {ex.type ?? 'all'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <StatsCounter proteins={proteins} interactions={interactions} datasets={datasets} />
        </div>

        {/* Right: example network */}
        <div>
          <div
            className="op-card"
            style={{ padding: 20, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}
          >
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <MiniNetworkGraph />
          </div>
        </div>
      </div>
    </section>
  )
}
