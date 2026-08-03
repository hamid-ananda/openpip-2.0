import type { Announcement } from '../../types/api'
import { useText } from '../../text'

interface AnnouncementsListProps {
  announcements: Announcement[]
}

export function AnnouncementsList({ announcements }: AnnouncementsListProps) {
  const t = useText()

  return (
    <div data-testid="announcements">
      <div style={{ overflow: 'hidden auto', maxHeight: 300 }}>
        {announcements.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
            {t('home.news.empty')}
          </p>
        ) : (
          announcements.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '14px 0',
                borderBottom: i < announcements.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              {a.date && (
                <span
                  className="op-num"
                  style={{
                    fontSize: 11,
                    color: 'var(--text-soft)',
                    minWidth: 72,
                    paddingTop: 2,
                  }}
                >
                  {a.date}
                </span>
              )}
              <div>
                <h4 style={{ fontWeight: 500, fontSize: 14, margin: '0 0 4px', color: 'var(--text)' }}>
                  {a.title}
                </h4>
                <div
                  style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}
                  dangerouslySetInnerHTML={{ __html: a.text }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
