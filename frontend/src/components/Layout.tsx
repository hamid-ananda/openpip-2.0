import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useTheme } from './useTheme'
import { applyBranding } from '../lib/branding'
import { TopBar } from './TopBar'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { useAuthStore } from '../store/authStore'

export function Layout() {
  const theme = useTheme()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  // The tab icon, tab title, address-bar colour and installed-app manifest are
  // all the site's branding, so they follow the settings — and update as soon
  // as an admin changes a title or uploads a logo.
  useEffect(() => {
    applyBranding(theme)
  }, [theme])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header
        style={{
          background: 'var(--nav-bg, var(--color-main))',
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
