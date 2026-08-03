import { useNavigate } from 'react-router-dom'
import { useProfile, useLogout } from '../../api/auth'
import { useSavedNetworks, useDeleteNetwork } from '../../api/networks'
import { useText } from '../../text'

// The admin shortcuts that used to sit here were a second, partial copy of the
// admin sidebar. Admins reach the same screens from the Admin link in the nav.

export function ProfilePage() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useProfile()
  const { mutate: logout, isPending } = useLogout()
  const { data: networks, isLoading: networksLoading } = useSavedNetworks()
  const { mutate: deleteNetwork } = useDeleteNetwork()
  const t = useText()

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
                {profile?.username ?? '-'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                {profile?.email ?? '-'}
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
              <div style={{ fontSize: 11, color: 'var(--text-soft)', marginBottom: 2 }}>{t('auth.profile.role')}</div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                {profile?.is_admin ? t('auth.profile.roleAdmin') : t('auth.profile.roleUser')}
              </div>
            </div>
          </div>
        </div>

        {/* Saved Networks */}
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
            Saved Networks
          </div>

          {networksLoading ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('auth.profile.loading')}</div>
          ) : !networks || networks.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('auth.profile.noNetworks')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {networks.map((net) => (
                <div
                  key={net.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
                      {net.name}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="op-chip" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
                        {net.query}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {net.interaction_count} interactions
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/search/${encodeURIComponent(net.query)}`)}
                    className="op-btn"
                    style={{ fontSize: 11, padding: '5px 10px', flexShrink: 0 }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteNetwork(net.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: 18,
                      lineHeight: 1,
                      padding: '4px',
                      flexShrink: 0,
                    }}
                    aria-label={`Delete ${net.name}`}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={() => logout(undefined, { onSuccess: () => navigate('/') })}
          disabled={isPending}
          className="op-btn"
          style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
        >
          {isPending ? t('auth.profile.signingOut') : t('auth.profile.signOut')}
        </button>
      </div>
    </div>
  )
}
