import type { Announcement } from '../../types/api'

interface AnnouncementsListProps {
  announcements: Announcement[]
}

export function AnnouncementsList({ announcements }: AnnouncementsListProps) {
  return (
    <div data-testid="announcements" className="rounded border overflow-hidden">
      <div
        className="px-4 py-2 text-sm font-semibold"
        style={{ backgroundColor: 'var(--color-main)', color: 'var(--color-header)' }}
      >
        Announcements
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
        {announcements.map((a) => (
          <div key={a.id} className="px-4 py-3 border-b last:border-b-0">
            <h4 className="font-semibold text-sm">{a.title}</h4>
            {a.date && <p className="text-xs text-gray-500 mb-1">{a.date}</p>}
            <div
              className="text-sm text-gray-700"
              dangerouslySetInnerHTML={{ __html: a.text }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
