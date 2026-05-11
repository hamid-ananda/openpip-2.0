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
      className="relative min-h-64 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: 'var(--color-main)' }}
    >
      <ParticleBackground id="hero-particles" className="absolute inset-0" />
      <div
        className="relative z-10 bg-white rounded-lg border-2 p-8 max-w-md w-full mx-4 text-center"
        style={{ borderColor: 'var(--color-main)' }}
      >
        <h1
          className="font-bold mb-4"
          style={{ color: 'var(--color-main)', fontSize: '80px', lineHeight: 1 }}
        >
          {shortTitle}
        </h1>
        <StatsCounter proteins={proteins} interactions={interactions} />
        <form onSubmit={handleSearch} className="mt-6 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter gene names, e.g. BAD,BCL2L1"
            className="flex-1 px-3 py-2 border rounded text-sm"
            style={{ borderColor: 'var(--color-main)' }}
          />
          <button
            type="submit"
            className="px-4 py-2 text-white text-sm rounded"
            style={{ backgroundColor: 'var(--color-main)' }}
          >
            Search
          </button>
        </form>
      </div>
    </section>
  )
}
