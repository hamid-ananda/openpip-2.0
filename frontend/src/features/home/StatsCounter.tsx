import { useCountUp } from '../../lib/useCountUp'

interface StatsCounterProps {
  proteins: number
  interactions: number
  datasets: number
  variant?: 'default' | 'hero'
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div
        className="op-num"
        style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--text)' }}
      >
        {n}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export function StatsCounter({ proteins, interactions, datasets }: StatsCounterProps) {
  const animatedProteins = useCountUp(proteins)
  const animatedInteractions = useCountUp(interactions)
  const animatedDatasets = useCountUp(datasets)

  return (
    <div style={{ display: 'flex', gap: 40 }}>
      <Stat n={animatedProteins.toLocaleString()} label="Proteins indexed" />
      <Stat n={animatedInteractions.toLocaleString()} label="Verified interactions" />
      <Stat n={animatedDatasets.toLocaleString()} label="Source datasets" />
    </div>
  )
}
