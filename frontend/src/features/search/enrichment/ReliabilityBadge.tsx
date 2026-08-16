/**
 * HPA Cell Atlas reliability score for a subcellular localisation call.
 * Vocabulary confirmed against the legacy annotation dump: `validated`,
 * `supported`, `approved` are the only values present.
 *
 * Deliberately styled like the interaction CategoryBadge but on a distinct
 * colour ramp — these are HPA's confidence levels, not openPIP's evidence
 * categories, and the two must not read as the same scale.
 */
const RELIABILITY_COLORS: Record<string, string> = {
  validated: 'var(--success)',
  supported: 'var(--accent)',
  approved: 'var(--text-muted)',
}

interface ReliabilityBadgeProps {
  level: string
  title?: string
}

export function ReliabilityBadge({ level, title }: ReliabilityBadgeProps) {
  const key = level.toLowerCase()
  return (
    <span
      title={title}
      style={{
        display: 'inline-block',
        borderRadius: 4,
        padding: '1px 7px',
        marginRight: 4,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'capitalize',
        background: 'var(--surface-2)',
        color: RELIABILITY_COLORS[key] ?? 'var(--text-muted)',
        border: '1px solid var(--border)',
      }}
    >
      {level}
    </span>
  )
}
