import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatsCounter } from './StatsCounter'
import { MiniNetworkGraph } from './MiniNetworkGraph'

interface HeroSectionProps {
  shortTitle: string
  proteins: number
  interactions: number
  datasets: number
}

export function HeroSection({ shortTitle, proteins, interactions, datasets }: HeroSectionProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

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
            <span style={{ color: 'var(--primary)' }}>interaction graph</span>,
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
            Interactome — visualized, filterable, and ready to export.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', marginBottom: 36 }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by gene names, e.g. BAD, BCL2L1"
              className="op-input"
              style={{ borderRadius: '8px 0 0 8px', borderRight: 'none', flex: 1 }}
              aria-label="Search proteins and interactions"
            />
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
