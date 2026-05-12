import { useTheme } from './useTheme'

interface TopBarProps {
  shortTitle: string
}

function DefaultLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="4" fill="rgba(255,255,255,0.9)" />
      <circle cx="5"  cy="8"  r="2.2" fill="var(--color-logo, rgba(255,255,255,0.75))" />
      <circle cx="27" cy="9"  r="2.2" fill="var(--color-logo, rgba(255,255,255,0.75))" />
      <circle cx="6"  cy="25" r="2.2" fill="var(--color-logo, rgba(255,255,255,0.75))" />
      <circle cx="26" cy="25" r="2.2" fill="var(--color-logo, rgba(255,255,255,0.75))" />
      <path
        d="M16 16 L5 8 M16 16 L27 9 M16 16 L6 25 M16 16 L26 25"
        stroke="var(--color-header, #ffffff)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity=".4"
      />
    </svg>
  )
}

export function TopBar({ shortTitle }: TopBarProps) {
  const theme = useTheme()
  const word = shortTitle || 'openPIP'

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
        padding: '0 28px',
      }}
    >
      {theme?.logoUrl ? (
        <img
          src={theme.logoUrl}
          alt={`${word} logo`}
          style={{ height: 28, width: 'auto', objectFit: 'contain' }}
        />
      ) : (
        <DefaultLogo />
      )}
      <span
        style={{
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: '-.015em',
          color: 'var(--color-header, #ffffff)',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </span>
    </div>
  )
}
