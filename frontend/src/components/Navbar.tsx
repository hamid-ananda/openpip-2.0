import { NavLink } from 'react-router-dom'
import { useLogout } from '../api/auth'
import { useDarkMode } from '../store/darkModeStore'

interface NavbarProps {
  isLoggedIn: boolean
  isAdmin?: boolean
}

const publicLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/search', label: 'Search', end: false },
  { to: '/download', label: 'Downloads', end: false },
  { to: '/about', label: 'About', end: false },
  { to: '/faq', label: 'FAQ', end: false },
  { to: '/contact', label: 'Contact', end: false },
]

const adminLinks = [
  { to: '/admin/announcement', label: 'Announcements', end: false },
  { to: '/admin/data', label: 'Data', end: false },
  { to: '/admin/files', label: 'Files', end: false },
  { to: '/admin/settings', label: 'Settings', end: false },
]

const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  padding: '6px 12px',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-header, #ffffff)',
  opacity: isActive ? 1 : 0.72,
  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
  textDecoration: 'none',
  transition: 'all .15s',
  display: 'inline-block',
})

export function Navbar({ isLoggedIn, isAdmin = false }: NavbarProps) {
  const logout = useLogout()
  const { dark, toggle } = useDarkMode()

  return (
    <nav
      style={{ display: 'flex', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}
      aria-label="Main navigation"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          flexWrap: 'wrap',
          gap: 2,
          padding: '0 8px',
        }}
      >
        {publicLinks.map((link) => (
          <NavLink key={link.to} to={link.to} style={linkStyle} end={link.end}>
            {link.label}
          </NavLink>
        ))}
        {isAdmin && adminLinks.map((link) => (
          <NavLink key={link.to} to={link.to} style={linkStyle} end={link.end}>
            {link.label}
          </NavLink>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          padding: '0 20px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={toggle}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            color: 'var(--color-header, #ffffff)',
            opacity: 0.75,
            fontSize: 16,
            transition: 'opacity .15s',
            padding: 0,
          }}
        >
          {dark ? '☀' : '☾'}
        </button>
        {isLoggedIn ? (
          <>
            <NavLink to="/profile" style={linkStyle}>
              Profile
            </NavLink>
            <button
              onClick={() => logout.mutate()}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-header, #ffffff)',
                opacity: 0.72,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 6,
                fontFamily: 'var(--font)',
                transition: 'opacity .15s',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" style={linkStyle}>
              Login
            </NavLink>
            <NavLink
              to="/register"
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: 'rgba(255,255,255,0.18)',
                color: 'var(--color-header, #ffffff)',
                border: '1px solid rgba(255,255,255,0.35)',
                textDecoration: 'none',
                transition: 'background .15s',
                display: 'inline-block',
              }}
            >
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  )
}
