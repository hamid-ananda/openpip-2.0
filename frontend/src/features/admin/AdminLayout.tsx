import { NavLink, Outlet } from 'react-router-dom'

/**
 * Shared shell for the admin section. Adds a sub-navigation bar so admins can
 * discover and move between the managers — previously each admin page was only
 * reachable by typing its URL, so "how do I update the news / home page" was
 * unclear. Labels spell out what each manager controls.
 */
const ADMIN_TABS = [
  { to: '/admin/settings', label: 'Site Settings', hint: 'Home page, About, FAQ, theme, colors' },
  { to: '/admin/announcement', label: 'News', hint: 'Homepage announcements' },
  { to: '/admin/data', label: 'Datasets', hint: 'Import and manage interaction data' },
  { to: '/admin/files', label: 'Files', hint: 'Downloadable supplementary files' },
]

const tabStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  padding: '14px 14px',
  fontSize: 13,
  fontWeight: 500,
  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
  borderBottom: `2px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
  textDecoration: 'none',
  marginBottom: -1,
  whiteSpace: 'nowrap',
})

export function AdminLayout() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          position: 'sticky',
          top: 56,
          zIndex: 20,
        }}
      >
        <nav
          aria-label="Admin sections"
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: '0 80px',
            overflowX: 'auto',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              color: 'var(--text-soft)',
              marginRight: 18,
              whiteSpace: 'nowrap',
            }}
          >
            Admin
          </span>
          {ADMIN_TABS.map((t) => (
            <NavLink key={t.to} to={t.to} title={t.hint} style={tabStyle}>
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  )
}
