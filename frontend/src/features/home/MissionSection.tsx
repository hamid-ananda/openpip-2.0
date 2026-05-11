import { Link } from 'react-router-dom'

interface MissionSectionProps {
  title: string
  text: string
}

export function MissionSection({ title, text }: MissionSectionProps) {
  return (
    <div>
      <div
        className="text-lg font-semibold mb-2"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div
        className="text-gray-700 leading-relaxed"
        style={{ fontSize: '18px' }}
        dangerouslySetInnerHTML={{ __html: text }}
      />
      <div className="flex gap-6 mt-6">
        {[
          { to: '/search', label: 'Search', icon: '🔍' },
          { to: '/about', label: 'About', icon: 'ℹ️' },
          { to: '/download', label: 'Download', icon: '💾' },
        ].map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 text-sm"
            style={{ color: 'var(--color-main)' }}
          >
            <span className="text-2xl">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
