interface TopBarProps {
  shortTitle: string
}

export function TopBar({ shortTitle }: TopBarProps) {
  return (
    <div className="flex items-center gap-3 shrink-0 px-4">
      <svg
        width="34"
        height="34"
        viewBox="0 0 100 100"
        aria-label="openPIP protein network logo"
      >
        <line x1="20" y1="50" x2="50" y2="20" stroke="var(--color-logo)" strokeWidth="3.5" />
        <line x1="50" y1="20" x2="80" y2="50" stroke="var(--color-logo)" strokeWidth="3.5" />
        <line x1="50" y1="20" x2="50" y2="80" stroke="var(--color-logo)" strokeWidth="3.5" />
        <circle cx="20" cy="50" r="9" fill="var(--color-logo)" />
        <circle cx="50" cy="20" r="9" fill="var(--color-logo)" />
        <circle cx="80" cy="50" r="9" fill="var(--color-logo)" />
        <circle cx="50" cy="80" r="9" fill="var(--color-logo)" />
        <circle cx="50" cy="50" r="9" fill="var(--color-logo)" />
      </svg>
      <span
        className="text-base font-bold tracking-tight whitespace-nowrap"
        style={{ color: 'var(--color-header)' }}
      >
        {shortTitle}
      </span>
    </div>
  )
}
