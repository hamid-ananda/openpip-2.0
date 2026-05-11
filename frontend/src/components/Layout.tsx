import { Outlet } from 'react-router-dom'
import { useTheme } from './useTheme'
import { TopBar } from './TopBar'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { useAuthStore } from '../store/authStore'

export function Layout() {
  const theme = useTheme()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const isAdmin = useAuthStore((s) => s.isAdmin)

  return (
    <div className="min-h-screen flex flex-col">
      <header style={{ backgroundColor: 'var(--color-main)' }}>
        <div className="flex items-center h-14">
          <TopBar shortTitle={theme?.shortTitle ?? 'openPIP'} />
          <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer html={theme?.footer ?? ''} />
    </div>
  )
}
