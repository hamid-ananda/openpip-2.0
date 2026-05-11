interface StatsCounterProps {
  proteins: number
  interactions: number
  variant?: 'default' | 'hero'
}

export function StatsCounter({ proteins, interactions, variant = 'default' }: StatsCounterProps) {
  const isHero = variant === 'hero'

  const numStyle = {
    color: isHero ? 'var(--color-header)' : 'var(--color-main)',
  }
  const labelStyle = {
    color: isHero ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)',
  }

  return (
    <div className="flex gap-10 justify-center">
      <div className="text-center">
        <div className="text-3xl font-bold" style={{ ...numStyle, fontVariantNumeric: 'tabular-nums' }}>
          {proteins.toLocaleString()}
        </div>
        <div className="text-xs uppercase tracking-widest mt-1 font-medium" style={labelStyle}>
          Proteins
        </div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold" style={{ ...numStyle, fontVariantNumeric: 'tabular-nums' }}>
          {interactions.toLocaleString()}
        </div>
        <div className="text-xs uppercase tracking-widest mt-1 font-medium" style={labelStyle}>
          Interactions
        </div>
      </div>
    </div>
  )
}
