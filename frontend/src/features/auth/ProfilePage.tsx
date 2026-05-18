import { Link, useNavigate } from 'react-router-dom'
import { useProfile, useLogout } from '../../api/auth'
import { Settings, Megaphone, Database, Folder } from 'lucide-react'

const ADMIN_LINKS = [
  { to: '/admin/settings',      label: 'Site Settings',       icon: Settings,  desc: 'Colors, titles, footer, logo' },
  { to: '/admin/announcement',  label: 'Announcements',       icon: Megaphone, desc: 'Manage homepage notices' },
  { to: '/admin/data',          label: 'Data Manager',        icon: Database,  desc: 'Datasets and database stats' },
  { to: '/admin/files',         label: 'File Manager',        icon: Folder,    desc: 'Upload supplementary files' },
]

export function ProfilePage() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useProfile()
  const { mutate: logout, isPending } = useLogout()

  if (isLoading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading profile…
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 56px)', padding: '48px 80px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Account card */}
        <div className="op-card" style={{ padding: 28, marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              marginBottom: 16,
            }}
          >
            Account
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--primary-soft)',
                color: 'var(--primary)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 20,
                fontWeight: 600,
                fontFamily: 'var(--mono)',
                flexShrink: 0,
              }}
            >
              {(profile?.username ?? '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>
                {profile?.username ?? '—'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                {profile?.email ?? '—'}
              </div>
            </div>
            {profile?.is_admin && (
              <span className="op-chip primary" style={{ marginLeft: 'auto' }}>
                Admin
              </span>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-soft)', marginBottom: 2 }}>Role</div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                {profile?.is_admin ? 'Administrator' : 'Registered user'}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Settings section */}
        {profile?.is_admin && (
          <div className="op-card" style={{ padding: 28, marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                marginBottom: 16,
              }}
            >
              Admin Settings
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {ADMIN_LINKS.map(({ to, label, icon: Icon, desc }) => (
                <Link
                  key={to}
                  to={to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    textDecoration: 'none',
                    transition: 'all .15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.background = 'var(--primary-soft)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'var(--surface)'
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'var(--surface-2)',
                      color: 'var(--text-muted)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} aria-hidden />
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={() => logout(undefined, { onSuccess: () => navigate('/') })}
          disabled={isPending}
          className="op-btn"
          style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
        >
          {isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}
