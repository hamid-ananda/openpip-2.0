import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatsCounter } from './StatsCounter'

interface HeroSectionProps {
  shortTitle: string
  proteins: number
  interactions: number
  datasets: number
}

/* Static BAD interactome visualization — decorative, no data dependency */
const PREVIEW_NODES = [
  { id: 'BAD',     x: 0,    y: 0,    query: true  },
  { id: 'YWHAB',   x: 0,    y: -155, query: false },
  { id: 'BCL2',    x: 140,  y: -80,  query: false },
  { id: 'YWHAZ',   x: 135,  y: 0,    query: false },
  { id: 'BCL2L1',  x: 155,  y: 60,   query: false },
  { id: 'AKT1',    x: 30,   y: 155,  query: false },
  { id: 'SFN',     x: -45,  y: 90,   query: false },
  { id: 'S100A10', x: -95,  y: -10,  query: false },
  { id: 'EWSR1',   x: -140, y: 10,   query: false },
  { id: 'BCL2L2',  x: -160, y: -55,  query: false },
  { id: 'RAF1',    x: 75,   y: -50,  query: false },
]

const PREVIEW_EDGES: [string, string, 'literature' | 'huri-lit' | 'hi-union'][] = [
  ['BAD', 'YWHAB',   'literature'],
  ['BAD', 'BCL2',    'literature'],
  ['BAD', 'YWHAZ',   'literature'],
  ['BAD', 'BCL2L1',  'huri-lit'],
  ['BAD', 'AKT1',    'literature'],
  ['BAD', 'SFN',     'huri-lit'],
  ['BAD', 'S100A10', 'literature'],
  ['BAD', 'EWSR1',   'huri-lit'],
  ['BAD', 'BCL2L2',  'huri-lit'],
  ['BAD', 'RAF1',    'literature'],
  ['RAF1', 'YWHAZ',  'literature'],
  ['BCL2', 'BCL2L1', 'literature'],
]

const EDGE_COLORS = {
  literature: 'var(--literature)',
  'huri-lit': 'var(--huri-lit)',
  'hi-union': 'var(--hi-union)',
}

function InteractomePreview() {
  const [hovered, setHovered] = useState<string | null>(null)
  const W = 400
  const H = 360
  const cx = W / 2
  const cy = H / 2

  const neighbors: Set<string> | null = hovered
    ? new Set([
        hovered,
        ...PREVIEW_EDGES.flatMap(([a, b]) =>
          a === hovered ? [b] : b === hovered ? [a] : []
        ),
      ])
    : null

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="rgba(37,99,235,.05)" />
          <stop offset="100%" stopColor="rgba(37,99,235,0)" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#hero-glow)" rx="10" />

      {PREVIEW_EDGES.map(([a, b, kind], i) => {
        const na = PREVIEW_NODES.find((n) => n.id === a)
        const nb = PREVIEW_NODES.find((n) => n.id === b)
        if (!na || !nb) return null
        const dim = neighbors && !(neighbors.has(a) && neighbors.has(b))
        return (
          <line
            key={i}
            x1={cx + na.x}
            y1={cy + na.y}
            x2={cx + nb.x}
            y2={cy + nb.y}
            stroke={EDGE_COLORS[kind]}
            strokeWidth={kind === 'huri-lit' ? 2.5 : 1.5}
            opacity={dim ? 0.08 : kind === 'huri-lit' ? 0.85 : 0.55}
            style={{ transition: 'opacity .2s' }}
          />
        )
      })}

      {PREVIEW_NODES.map((n) => {
        const dim = neighbors && !neighbors.has(n.id)
        return (
          <g
            key={n.id}
            className={n.query ? 'hero-query-node' : undefined}
            transform={`translate(${cx + n.x},${cy + n.y})`}
            style={{
              cursor: 'pointer',
              opacity: dim ? 0.25 : 1,
              transition: 'opacity .2s',
            }}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <circle
              r={n.query ? 22 : 18}
              fill={n.query ? 'var(--query)' : 'var(--interactor)'}
            />
            <text
              textAnchor="middle"
              dy=".35em"
              fontSize={n.query ? 10 : 9}
              fontFamily="var(--mono)"
              fontWeight="500"
              fill="#fff"
            >
              {n.id}
            </text>
          </g>
        )
      })}
    </svg>
  )
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

        {/* Right: live network preview */}
        <div>
          <div
            className="op-card"
            style={{ padding: 20, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ fontFamily: 'var(--mono)' }}>BAD · interactome</span>
              <span className="op-chip dot" style={{ color: 'var(--success)' }}>
                live
              </span>
            </div>
            <InteractomePreview />
          </div>
        </div>
      </div>
    </section>
  )
}
