import { useParams } from 'react-router-dom'
import { usePublicProfile } from '../../api/users'

export function PublicProfilePage() {
  const { username = '' } = useParams<{ username: string }>()
  const { data: profile, isLoading, isError } = usePublicProfile(username)

  if (isLoading) {
    return <p style={{ padding: 24, color: 'var(--text-muted)' }}>Loading…</p>
  }
  if (isError || !profile) {
    return (
      <p style={{ padding: 24, color: 'var(--text)' }}>No openPIP user by that name.</p>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {profile.avatar && (
          <img
            src={profile.avatar}
            alt=""
            width={72}
            height={72}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
          />
        )}
        <div>
          <h1 style={{ fontSize: 22, margin: 0, color: 'var(--text)' }}>
            {profile.name || profile.username}
          </h1>
          {profile.position && (
            <p style={{ margin: '2px 0 0', color: 'var(--text-soft)' }}>{profile.position}</p>
          )}
          {profile.affiliation && (
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)' }}>
              {profile.affiliation}
            </p>
          )}
        </div>
      </div>

      {profile.website && (
        <p style={{ marginTop: 16 }}>
          <a href={profile.website} target="_blank" rel="noreferrer noopener">
            {profile.website}
          </a>
        </p>
      )}
      {profile.bio && (
        <p style={{ marginTop: 12, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
          {profile.bio}
        </p>
      )}
    </div>
  )
}
