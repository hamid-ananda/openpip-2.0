import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ParticleBackground } from './ParticleBackground'
import { StatsCounter } from './StatsCounter'

interface HeroSectionProps {
  shortTitle: string
  proteins: number
  interactions: number
}

export function HeroSection({ shortTitle, proteins, interactions }: HeroSectionProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = query.trim()
    if (term) navigate(`/search/${encodeURIComponent(term)}`)
  }

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: 'var(--color-main)', minHeight: 300 }}
    >
      <ParticleBackground id="hero-particles" className="absolute inset-0" />
      <div className="relative z-10 text-center px-4 py-14 max-w-2xl w-full">
        <h1
          className="text-5xl font-bold tracking-tight mb-2"
          style={{ color: 'var(--color-header)' }}
        >
          {shortTitle || 'openPIP'}
        </h1>
        <p className="text-sm mb-8 opacity-75" style={{ color: 'var(--color-header)' }}>
          Plant protein–protein interaction database
        </p>
        <StatsCounter proteins={proteins} interactions={interactions} variant="hero" />
        <form onSubmit={handleSearch} className="mt-8 flex rounded-xl overflow-hidden shadow-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by gene names, e.g. BAD, BCL2L1"
            className="flex-1 px-5 py-3.5 text-sm bg-white focus:outline-none"
            style={{ color: 'var(--text-primary)' }}
            aria-label="Search proteins and interactions"
          />
          <button
            type="submit"
            className="px-6 py-3.5 text-sm font-semibold bg-white whitespace-nowrap border-l"
            style={{ color: 'var(--color-main)', borderColor: 'var(--border)' }}
          >
            Search
          </button>
        </form>
      </div>
    </section>
  )
}
