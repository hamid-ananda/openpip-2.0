import { Outlet } from 'react-router-dom'
import { useTheme } from './useTheme'
import { TopBar } from './TopBar'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { useAuthStore } from '../store/authStore'

export function Layout() {
  const theme = useTheme()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', height: 56 }}>
          <TopBar shortTitle={theme?.shortTitle ?? 'openPIP'} />
          <Navbar isLoggedIn={isLoggedIn} />
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer html={theme?.footer ?? ''} />
    </div>
  )
}
