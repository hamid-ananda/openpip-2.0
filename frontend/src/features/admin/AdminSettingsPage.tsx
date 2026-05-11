import { useState } from 'react'
import { useSettings, useUpdateSettings } from '../../api/settings'
import type { AdminSettings } from '../../types/api'

// Fields split by type for layout
const TEXT_FIELDS: (keyof AdminSettings)[] = [
  'title', 'shortTitle', 'footer', 'homePage',
  'missionTitle', 'missionText', 'methodTitle', 'methodText',
  'url', 'version',
]

const COLOR_FIELDS: (keyof AdminSettings)[] = [
  'mainColorScheme', 'headerColorScheme', 'logoColorScheme', 'buttonColorScheme',
  'queryNodeColor', 'interactorNodeColor',
  'publishedEdgeColor', 'validatedEdgeColor', 'verifiedEdgeColor', 'literatureEdgeColor',
]

const FIELD_LABELS: Partial<Record<keyof AdminSettings, string>> = {
  title: 'Site Title',
  shortTitle: 'Short Title',
  footer: 'Footer Text',
  homePage: 'Home Page HTML',
  missionTitle: 'Mission Title',
  missionText: 'Mission Text',
  methodTitle: 'Method Title',
  methodText: 'Method Text',
  url: 'Site URL',
  version: 'Version',
  mainColorScheme: 'Primary Color',
  headerColorScheme: 'Header Color',
  logoColorScheme: 'Logo Color',
  buttonColorScheme: 'Button Color',
  queryNodeColor: 'Query Node Color',
  interactorNodeColor: 'Interactor Node Color',
  publishedEdgeColor: 'Published Edge Color',
  validatedEdgeColor: 'Validated Edge Color',
  verifiedEdgeColor: 'Verified Edge Color',
  literatureEdgeColor: 'Literature Edge Color',
}

// Inner form component receives settings as a prop to allow safe useState initialization
interface SettingsFormProps {
  initialSettings: AdminSettings
}

function SettingsForm({ initialSettings }: SettingsFormProps) {
  const { mutate: update, isPending, isSuccess } = useUpdateSettings()
  const [form, setForm] = useState<Partial<AdminSettings>>(initialSettings)

  const handleChange = (field: keyof AdminSettings, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    update(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Content settings */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Content</h2>
        <div className="space-y-4">
          {TEXT_FIELDS.map((field) => {
            const isTextarea = ['homePage', 'missionText', 'methodText', 'footer'].includes(field)
            return (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {FIELD_LABELS[field] ?? field}
                </label>
                {isTextarea ? (
                  <textarea
                    value={(form[field] as string) ?? ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-y"
                  />
                ) : (
                  <input
                    type="text"
                    value={(form[field] as string) ?? ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Color settings */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Colors</h2>
        <div className="grid grid-cols-2 gap-4">
          {COLOR_FIELDS.map((field) => (
            <div key={field} className="flex items-center gap-3">
              <input
                type="color"
                value={(form[field] as string) ?? '#000000'}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5"
              />
              <div>
                <div className="text-sm font-medium text-gray-700">{FIELD_LABELS[field] ?? field}</div>
                <div className="text-xs text-gray-400">{(form[field] as string) ?? ''}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 rounded text-white text-sm font-medium disabled:opacity-60"
          style={{ background: 'var(--color-button)' }}
        >
          {isPending ? 'Saving...' : 'Save Settings'}
        </button>
        {isSuccess && (
          <span className="text-green-600 text-sm">Settings saved successfully.</span>
        )}
      </div>
    </form>
  )
}

export function AdminSettingsPage() {
  const { data: settings, isLoading } = useSettings()

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--color-main)' }}>
        Site Settings
      </h1>
      {settings && <SettingsForm initialSettings={settings} />}
    </div>
  )
}
