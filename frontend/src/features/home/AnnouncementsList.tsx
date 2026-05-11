import type { Announcement } from '../../types/api'

interface AnnouncementsListProps {
  announcements: Announcement[]
}

export function AnnouncementsList({ announcements }: AnnouncementsListProps) {
  return (
    <div data-testid="announcements">
      <p
        className="text-xs font-medium uppercase tracking-widest mb-2"
        style={{ color: 'var(--text-muted)' }}
      >
        Announcements
      </p>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
          {announcements.length === 0 ? (
            <p className="px-5 py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              No announcements.
            </p>
          ) : (
            announcements.map((a) => (
              <div
                key={a.id}
                className="px-5 py-4 last:border-b-0"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  {a.title}
                </h4>
                {a.date && (
                  <p className="text-xs mt-0.5 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    {a.date}
                  </p>
                )}
                <div
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                  dangerouslySetInnerHTML={{ __html: a.text }}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
