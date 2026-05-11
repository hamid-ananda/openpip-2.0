import { useAuthStore } from '../../store/authStore'
import { useDatasets } from '../../api/downloads'

const STATUS_COLORS: Record<string, string> = {
  Published: 'bg-blue-100 text-blue-800',
  Validated: 'bg-green-100 text-green-800',
  Verified: 'bg-purple-100 text-purple-800',
  Literature: 'bg-red-100 text-red-800',
}

export function DownloadPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const { data: datasets, isLoading } = useDatasets()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-main)' }}>
        Downloads
      </h1>
      <p className="text-gray-600 mb-6">
        Download interaction datasets.{' '}
        {!isLoggedIn && 'Log in to access download links.'}
      </p>

      {isLoading ? (
        <p className="text-gray-500">Loading datasets...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Dataset</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Authors</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Year</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Download</th>
              </tr>
            </thead>
            <tbody>
              {datasets?.map((ds) => (
                <tr key={ds.dataset_reference} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium">{ds.name}</div>
                    <div className="text-gray-500 text-xs">{ds.description}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{ds.dataset_author}</td>
                  <td className="py-3 px-4 text-gray-600">{ds.year}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ds.interaction_status] ?? 'bg-gray-100 text-gray-800'}`}
                    >
                      {ds.interaction_status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {isLoggedIn ? (
                      <a
                        href={`/api/datasets/${ds.dataset_reference}/download`}
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-main)' }}
                      >
                        Download
                      </a>
                    ) : (
                      <a href="/login" className="text-sm text-gray-400 hover:underline">
                        Log in to download
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
