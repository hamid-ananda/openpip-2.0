import { NavLink } from 'react-router-dom'
import { useLogout } from '../api/auth'

interface NavbarProps {
  isLoggedIn: boolean
  isAdmin: boolean
}

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search' },
  { to: '/download', label: 'Downloads' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
]

const adminLinks = [
  { to: '/admin/announcement', label: 'Announcements' },
  { to: '/admin/data', label: 'Data' },
  { to: '/admin/files', label: 'Files' },
  { to: '/admin/settings', label: 'Settings' },
]

export function Navbar({ isLoggedIn, isAdmin }: NavbarProps) {
  const logout = useLogout()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 text-sm font-medium transition-opacity ${isActive ? 'underline opacity-100' : 'opacity-80 hover:opacity-100'}`

  return (
    <nav
      className="flex items-center gap-1 px-4 py-1 flex-wrap"
      style={{ backgroundColor: 'var(--color-main)', color: 'var(--color-header)' }}
    >
      <div className="flex items-center gap-1 flex-1 flex-wrap">
        {publicLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClass}
            style={{ color: 'var(--color-header)' }}>
            {link.label}
          </NavLink>
        ))}
        {isAdmin && adminLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClass}
            style={{ color: 'var(--color-header)' }}>
            {link.label}
          </NavLink>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {isLoggedIn ? (
          <>
            <NavLink to="/profile" className={linkClass} style={{ color: 'var(--color-header)' }}>
              Profile
            </NavLink>
            <button
              onClick={() => logout.mutate()}
              className="px-3 py-2 text-sm font-medium opacity-80 hover:opacity-100"
              style={{ color: 'var(--color-header)' }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/register" className={linkClass} style={{ color: 'var(--color-header)' }}>
              Register
            </NavLink>
            <NavLink to="/login" className={linkClass} style={{ color: 'var(--color-header)' }}>
              Login
            </NavLink>
          </>
        )}
      </div>
    </nav>
  )
}
