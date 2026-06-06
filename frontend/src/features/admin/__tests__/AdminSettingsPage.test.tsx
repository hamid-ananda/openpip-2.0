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

vi.mock('react-quill-new', () => ({
  default: ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <textarea
      data-testid="rich-text-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}))

vi.mock('react-quill-new/dist/quill.snow.css', () => ({}))

vi.mock('../../../api/interactionCategories', () => ({
  useInteractionCategories: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useCreateCategory: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useUpdateCategory: vi.fn().mockReturnValue({ mutate: vi.fn() }),
  useDeleteCategory: vi.fn().mockReturnValue({ mutate: vi.fn() }),
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
  about: '<p>About openPIP.</p>',
  faq: '<p>FAQ content.</p>',
  contact: '<p>Contact intro.</p>',
  download: '<p>Download intro.</p>',
  showDownloads: true,
  showDownloadAll: true,
  example1: 'BAD\nBAK1',
  example2: 'BAD',
  example3: '',
  example1Type: 'query-query',
  example2Type: 'query-interactor',
  example3Type: 'all',
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

  it('renders Global Settings tab by default', () => {
    ;(useSettings as ReturnType<typeof vi.fn>).mockReturnValue({ data: mockSettings, isLoading: false })
    render(<AdminSettingsPage />, { wrapper })
    expect(screen.getByText('Global Settings')).toBeInTheDocument()
    expect(screen.getByText('Site Title')).toBeInTheDocument()
  })

  it('shows About editor when About tab is clicked', () => {
    ;(useSettings as ReturnType<typeof vi.fn>).mockReturnValue({ data: mockSettings, isLoading: false })
    render(<AdminSettingsPage />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /^about$/i }))
    expect(screen.getByText('About page content')).toBeInTheDocument()
  })

  it('shows Downloads toggles when Downloads tab is clicked', () => {
    ;(useSettings as ReturnType<typeof vi.fn>).mockReturnValue({ data: mockSettings, isLoading: false })
    render(<AdminSettingsPage />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /downloads/i }))
    expect(screen.getByText('Show Dataset Downloads')).toBeInTheDocument()
    expect(screen.getByText('Show Download All Datasets')).toBeInTheDocument()
  })
})
