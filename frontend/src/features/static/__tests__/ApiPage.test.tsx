import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { ApiPage } from '../ApiPage'
import { apiBase } from '../../../lib/apiBase'
import { useSettings } from '../../../api/settings'

vi.mock('../../../api/settings', () => ({ useSettings: vi.fn() }))

function renderWithUrl(url: string | undefined) {
  ;(useSettings as ReturnType<typeof vi.fn>).mockReturnValue({ data: url ? { url } : undefined })
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ApiPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('apiBase', () => {
  it('uses the configured site URL', () => {
    expect(apiBase('https://ppi.mylab.edu')).toBe('https://ppi.mylab.edu')
  })

  it('drops trailing slashes so paths do not double up', () => {
    expect(apiBase('https://ppi.mylab.edu///')).toBe('https://ppi.mylab.edu')
  })

  it('falls back to the current origin when no site URL is set', () => {
    for (const empty of [undefined, null, '', '   ']) {
      expect(apiBase(empty)).toBe(window.location.origin)
    }
  })
})

describe('ApiPage', () => {
  it('points its code samples at the deployment, not the reference host', () => {
    renderWithUrl('https://ppi.mylab.edu')

    // Every sample is copy-paste ready, so a self-hosted site must never be
    // told to curl the lab that happens to run the reference deployment.
    expect(screen.getAllByText(/ppi\.mylab\.edu\/api\/search/).length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toContain('openpip.usask.ca')
  })

  it('falls back to the serving origin before settings arrive', () => {
    renderWithUrl(undefined)
    expect(document.body.textContent).toContain(`${window.location.origin}/api/search`)
  })
})
