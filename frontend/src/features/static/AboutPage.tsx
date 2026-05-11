import { useSettings } from '../../api/settings'

export function AboutPage() {
  const { data: settings, isLoading } = useSettings()

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-main)' }}>
        About {settings?.title ?? 'This Database'}
      </h1>

      {settings?.homePage ? (
        <div
          className="prose max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: settings.homePage }}
        />
      ) : (
        <div className="space-y-4 text-gray-700">
          <p>{settings?.missionText}</p>
          <p>{settings?.methodText}</p>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
        <p>
          Version {settings?.version} ·{' '}
          <a
            href={settings?.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-main)' }}
          >
            {settings?.url}
          </a>
        </p>
      </div>
    </div>
  )
}
