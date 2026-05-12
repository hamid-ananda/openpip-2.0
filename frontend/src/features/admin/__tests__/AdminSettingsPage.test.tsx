import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminSettingsPage } from '../AdminSettingsPage'
import { useSettings, useUpdateSettings } from '../../../api/settings'

vi.mock('../../../api/settings', () => ({
  useSettings: vi.fn(),
  useUpdateSettings: vi.fn(),
  useUploadLogo: vi.fn(),
  useDeleteLogo: vi.fn(),
}))

const mockSettings = {
  title: 'openPIP — Protein Interaction Portal',
  shortTitle: 'openPIP',
  footer: '<p>© 2026 openPIP. All rights reserved.</p>',
  homePage: '',
  missionTitle: '<h4>Our Mission</h4>',
  missionText: '<p>openPIP provides a curated map of human protein–protein interactions.</p>',
  methodTitle: '<h4>Methods</h4>',
  methodText: '<p>Interactions are sourced from published experimental datasets.</p>',
  mainColorScheme: '#a51c30',
  headerColorScheme: '#ffffff',
  logoColorScheme: '#ffffff',
  buttonColorScheme: '#a51c30',
  queryNodeColor: '#cc0000',
  interactorNodeColor: '#3c78d8',
  publishedEdgeColor: '#38761d',
  validatedEdgeColor: '#1155cc',
  verifiedEdgeColor: '#cc0000',
  literatureEdgeColor: '#ff9900',
  url: 'http://localhost:5173/',
  version: '2.0',
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

import { useUploadLogo, useDeleteLogo } from '../../../api/settings'

describe('AdminSettingsPage', () => {
  beforeEach(() => {
    ;(useUpdateSettings as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
    })
    ;(useUploadLogo as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
    ;(useDeleteLogo as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
  })

  it('shows loading state when useSettings returns isLoading: true', () => {
    ;(useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    render(<AdminSettingsPage />, { wrapper })

    expect(screen.getByText('Loading settings...')).toBeInTheDocument()
  })

  it('renders "Site Title" field with the setting value when data loads', () => {
    ;(useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockSettings,
      isLoading: false,
    })

    render(<AdminSettingsPage />, { wrapper })

    expect(screen.getByText('Site Title')).toBeInTheDocument()
    expect(screen.getByDisplayValue('openPIP — Protein Interaction Portal')).toBeInTheDocument()
  })

  it('renders "Primary color" color input', () => {
    ;(useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockSettings,
      isLoading: false,
    })

    render(<AdminSettingsPage />, { wrapper })

    const primaryColorLabel = screen.getByText('Primary color')
    expect(primaryColorLabel).toBeInTheDocument()

    // The color input should be present with the mainColorScheme value
    const colorInputs = document.querySelectorAll('input[type="color"]')
    expect(colorInputs.length).toBeGreaterThan(0)
    const mainColorInput = colorInputs[0] as HTMLInputElement
    expect(mainColorInput.value).toBe('#a51c30')
  })

  it('clicking Save calls the update mutate function', () => {
    const mockUpdate = vi.fn()
    ;(useUpdateSettings as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: mockUpdate,
      isPending: false,
      isSuccess: false,
    })
    ;(useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockSettings,
      isLoading: false,
    })

    render(<AdminSettingsPage />, { wrapper })

    const saveButton = screen.getByRole('button', { name: /save settings/i })
    fireEvent.click(saveButton)

    expect(mockUpdate).toHaveBeenCalledOnce()
  })
})
