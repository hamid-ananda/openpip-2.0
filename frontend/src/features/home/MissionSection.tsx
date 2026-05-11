import { Link } from 'react-router-dom'
import { Search, Info, Download } from 'lucide-react'

interface MissionSectionProps {
  title: string
  text: string
}

export function MissionSection({ title, text }: MissionSectionProps) {
  return (
    <div>
      <div
        className="text-lg font-semibold mb-3"
        style={{ color: 'var(--text-primary)' }}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div
        className="leading-relaxed"
        style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '55ch' }}
        dangerouslySetInnerHTML={{ __html: text }}
      />
      <div className="flex gap-5 mt-6">
        {[
          { to: '/search', label: 'Search', Icon: Search },
          { to: '/about', label: 'About', Icon: Info },
          { to: '/download', label: 'Download', Icon: Download },
        ].map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-1.5 text-sm font-medium hover:underline underline-offset-2 transition-opacity hover:opacity-80"
            style={{ color: 'var(--color-main)' }}
          >
            <Icon size={14} aria-hidden />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
