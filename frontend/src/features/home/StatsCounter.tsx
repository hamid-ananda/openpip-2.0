interface StatsCounterProps {
  proteins: number
  interactions: number
}

export function StatsCounter({ proteins, interactions }: StatsCounterProps) {
  return (
    <div className="flex gap-8 justify-center mt-4">
      <div className="text-center">
        <div className="text-4xl font-bold" style={{ color: 'var(--color-main)' }}>
          {proteins.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600 uppercase tracking-wide mt-1">Proteins</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold" style={{ color: 'var(--color-main)' }}>
          {interactions.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600 uppercase tracking-wide mt-1">Interactions</div>
      </div>
    </div>
  )
}
