interface TopBarProps {
  shortTitle: string
}

export function TopBar({ shortTitle }: TopBarProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-[var(--color-main)]">
      <svg width="48" height="48" viewBox="0 0 100 100" aria-label="openPIP protein network logo">
        <line x1="20" y1="50" x2="50" y2="20" stroke="var(--color-logo)" strokeWidth="3" />
        <line x1="50" y1="20" x2="80" y2="50" stroke="var(--color-logo)" strokeWidth="3" />
        <line x1="50" y1="20" x2="50" y2="80" stroke="var(--color-logo)" strokeWidth="3" />
        <circle cx="20" cy="50" r="10" fill="var(--color-logo)" />
        <circle cx="50" cy="20" r="10" fill="var(--color-logo)" />
        <circle cx="80" cy="50" r="10" fill="var(--color-logo)" />
        <circle cx="50" cy="80" r="10" fill="var(--color-logo)" />
        <circle cx="50" cy="50" r="10" fill="var(--color-logo)" />
      </svg>
      <span className="text-xl font-bold tracking-wide" style={{ color: 'var(--color-header)' }}>
        {shortTitle}
      </span>
    </div>
  )
}
