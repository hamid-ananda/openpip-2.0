import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile, useLogout, useUpdateProfile } from '../../api/auth'
import type { Profile } from '../../api/auth'
import { mediaUrl } from '../../api/client'
import { useSavedNetworks, useDeleteNetwork } from '../../api/networks'
import { useText } from '../../text'

// The admin shortcuts that used to sit here were a second, partial copy of the
// admin sidebar. Admins reach the same screens from the Admin link in the nav.

// The optional details, in the order they are shown and edited.
const DETAIL_FIELDS: { key: keyof Profile; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Name', placeholder: 'Your name' },
  { key: 'position', label: 'Position', placeholder: 'PhD student, PI, …' },
  { key: 'affiliation', label: 'Affiliation', placeholder: 'Institution or lab' },
  { key: 'website', label: 'Website', placeholder: 'https://…' },
]

function Avatar({ profile, size = 52 }: { profile?: Profile; size?: number }) {
  const common = { width: size, height: size, borderRadius: '50%', flexShrink: 0 } as const
  if (profile?.avatar) {
    return <img src={mediaUrl(profile.avatar)} alt="" style={{ ...common, objectFit: 'cover' }} />
  }
  return (
    <div
      style={{
        ...common,
        background: 'var(--primary-soft)',
        color: 'var(--primary)',
        display: 'grid',
        placeItems: 'center',
        fontSize: size / 2.6,
        fontWeight: 600,
        fontFamily: 'var(--mono)',
      }}
    >
      {((profile?.name || profile?.username) ?? '?')[0].toUpperCase()}
    </div>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useProfile()
  const { mutate: updateProfile, isPending: saving, error: saveError } = useUpdateProfile()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const fileInput = useRef<HTMLInputElement>(null)
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
            <Avatar profile={profile} />
            <div data-selectable>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>
                {profile?.name || profile?.username || '-'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                {profile?.name ? profile.username : (profile?.email ?? '-')}
              </div>
            </div>
            {profile?.is_admin && (
              <span className="op-chip primary" style={{ marginLeft: 'auto' }}>
                Admin
              </span>
            )}
          </div>

          {/* Details, all optional — an empty profile shows the role alone. */}
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const file = fileInput.current?.files?.[0]
                updateProfile(
                  { ...form, ...(file ? { avatar: file } : {}) },
                  { onSuccess: () => setEditing(false) },
                )
              }}
              style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {DETAIL_FIELDS.map(({ key, label, placeholder }) => (
                  <label key={key} style={{ fontSize: 11, color: 'var(--text-soft)' }}>
                    {label}
                    <input
                      className="op-input"
                      type={key === 'website' ? 'url' : 'text'}
                      value={form[key] ?? ''}
                      placeholder={placeholder}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </label>
                ))}
              </div>

              <label style={{ fontSize: 11, color: 'var(--text-soft)', display: 'block', marginTop: 12 }}>
                Bio
                <textarea
                  className="op-input"
                  rows={3}
                  value={form.bio ?? ''}
                  placeholder="A line or two about your work"
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  style={{ width: '100%', marginTop: 4, resize: 'vertical' }}
                />
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <Avatar profile={profile} size={36} />
                <label style={{ fontSize: 11, color: 'var(--text-soft)' }}>
                  Picture
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    style={{ display: 'block', marginTop: 4, fontSize: 12 }}
                  />
                </label>
                {profile?.avatar && (
                  <button
                    type="button"
                    className="op-btn ghost"
                    onClick={() => updateProfile({ avatar: '' })}
                    style={{ fontSize: 11, padding: '4px 10px', marginLeft: 'auto' }}
                  >
                    Remove picture
                  </button>
                )}
              </div>

              {saveError && (
                <div role="alert" style={{ fontSize: 12, color: 'var(--danger)', marginTop: 10 }}>
                  Could not save. Check the website address and picture size (2 MB max).
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="submit" className="op-btn primary" disabled={saving} style={{ fontSize: 12 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  className="op-btn"
                  onClick={() => setEditing(false)}
                  style={{ fontSize: 12 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-soft)', marginBottom: 2 }}>{t('auth.profile.role')}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                    {profile?.is_admin ? t('auth.profile.roleAdmin') : t('auth.profile.roleUser')}
                  </div>
                </div>
                {DETAIL_FIELDS.filter(({ key }) => key !== 'name' && profile?.[key]).map(
                  ({ key, label }) => (
                    <div key={key} data-selectable>
                      <div style={{ fontSize: 11, color: 'var(--text-soft)', marginBottom: 2 }}>{label}</div>
                      {key === 'website' ? (
                        <a
                          href={profile!.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}
                        >
                          {profile!.website}
                        </a>
                      ) : (
                        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                          {profile![key]}
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>

              {profile?.bio && (
                <p data-selectable style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '12px 0 0' }}>
                  {profile.bio}
                </p>
              )}

              <button
                className="op-btn"
                onClick={() => {
                  setForm({
                    name: profile?.name ?? '',
                    position: profile?.position ?? '',
                    affiliation: profile?.affiliation ?? '',
                    website: profile?.website ?? '',
                    bio: profile?.bio ?? '',
                  })
                  setEditing(true)
                }}
                style={{ fontSize: 12, marginTop: 16 }}
              >
                Edit profile
              </button>
            </div>
          )}
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
