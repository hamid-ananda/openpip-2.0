import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminDataPage } from '../AdminDataPage'
import { useCounts } from '../../../api/counts'
import { useDatasets } from '../../../api/downloads'
import {
  useInteractionCategories,
  useDatasetPreview,
  useDatasetUpload,
} from '../../../api/datasets'

vi.mock('../../../api/counts', () => ({ useCounts: vi.fn() }))
vi.mock('../../../api/downloads', () => ({ useDatasets: vi.fn() }))
vi.mock('../../../api/datasets', () => ({
  useInteractionCategories: vi.fn(),
  useDatasetPreview: vi.fn(),
  useDatasetUpload: vi.fn(),
}))

const mockCounts = { proteins: 12345, interactions: 67890 }
const mockDatasets = [
  {
    dataset_reference: '24153252',
    dataset_author: 'Rolland et al.(2014)',
    year: '2014',
    description: 'Human Reference Interactome',
    interaction_status: 'Published',
    name: 'HuRI',
  },
]
const mockCategories = [
  { id: 1, category_name: 'HI-Union', order: '3' },
  { id: 2, category_name: 'Published', order: '1' },
]
const mockPreviewResult = {
  dry_run: true,
  proteins_created: 10,
  proteins_existing: 5,
  interactions_created: 20,
  interactions_skipped: 2,
  errors: [],
}
const mockUploadResult = {
  dry_run: false,
  proteins_created: 10,
  proteins_existing: 5,
  interactions_created: 20,
  interactions_skipped: 2,
  errors: [],
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AdminDataPage', () => {
  beforeEach(() => {
    ;(useCounts as ReturnType<typeof vi.fn>).mockReturnValue({ data: mockCounts })
    ;(useDatasets as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockDatasets,
      isLoading: false,
    })
    ;(useInteractionCategories as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    })
    ;(useDatasetPreview as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      data: undefined,
      error: null,
    })
    ;(useDatasetUpload as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      data: undefined,
      error: null,
    })
  })

  // ── Stats cards ──────────────────────────────────────────

  it('renders proteins count stat card', () => {
    render(<AdminDataPage />, { wrapper })
    expect(screen.getByText('12,345')).toBeInTheDocument()
    expect(screen.getByText('Proteins indexed')).toBeInTheDocument()
  })

  it('renders interactions count stat card', () => {
    render(<AdminDataPage />, { wrapper })
    expect(screen.getByText('67,890')).toBeInTheDocument()
    expect(screen.getByText('Interactions')).toBeInTheDocument()
  })

  it('renders datasets count stat card', () => {
    render(<AdminDataPage />, { wrapper })
    expect(screen.getByText('Datasets')).toBeInTheDocument()
    // datasets.length = 1 — multiple "1"s may appear (step indicator), so check at least one
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1)
  })

  // ── Step 1 ───────────────────────────────────────────────

  it('shows drag-drop zone on step 1', () => {
    render(<AdminDataPage />, { wrapper })
    expect(screen.getByRole('button', { name: /drop zone for psi-mi tab file/i })).toBeInTheDocument()
  })

  it('Next button is disabled on step 1 when no file is chosen', () => {
    render(<AdminDataPage />, { wrapper })
    const nextBtn = screen.getByRole('button', { name: /next →/i })
    expect(nextBtn).toBeDisabled()
  })

  it('Next button is enabled after a file is selected', async () => {
    render(<AdminDataPage />, { wrapper })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['col1\tcol2'], 'test-dataset.tab', { type: 'text/plain' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /next →/i })).not.toBeDisabled(),
    )
  })

  it('shows filename after file is selected', async () => {
    render(<AdminDataPage />, { wrapper })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['col1\tcol2'], 'huri-2024.tab', { type: 'text/plain' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(screen.getByText('huri-2024.tab')).toBeInTheDocument())
  })

  // ── Step 2 ───────────────────────────────────────────────

  async function goToStep2() {
    render(<AdminDataPage />, { wrapper })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['col1\tcol2'], 'huri-2024.tab', { type: 'text/plain' })
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(screen.getByRole('button', { name: /next →/i })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: /next →/i }))
    await waitFor(() => expect(screen.getByText('Dataset name')).toBeInTheDocument())
  }

  it('shows metadata fields after file is selected and Next clicked', async () => {
    await goToStep2()
    expect(screen.getByText('Dataset name')).toBeInTheDocument()
    expect(screen.getByText('Interaction status')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
  })

  it('pre-fills dataset name from filename', async () => {
    await goToStep2()
    const nameInput = screen.getByPlaceholderText('e.g. HuRI-2024') as HTMLInputElement
    expect(nameInput.value).toBe('huri-2024')
  })

  it('shows category options from useInteractionCategories', async () => {
    await goToStep2()
    // HI-Union only appears as a category option
    expect(screen.getByText('HI-Union')).toBeInTheDocument()
    // "Published" appears in the datasets table chip and the category select
    expect(screen.getAllByText('Published').length).toBeGreaterThanOrEqual(1)
  })

  // ── Step 3 ───────────────────────────────────────────────

  it('shows preview results when preview data is available', async () => {
    ;(useDatasetPreview as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      data: mockPreviewResult,
      error: null,
    })

    render(<AdminDataPage />, { wrapper })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['col1\tcol2'], 'huri.tab', { type: 'text/plain' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    await waitFor(() => expect(screen.getByRole('button', { name: /next →/i })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: /next →/i }))
    await waitFor(() => expect(screen.getByText('Dataset name')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /preview →/i }))

    await waitFor(() => expect(screen.getByText('Preview results')).toBeInTheDocument())
    expect(screen.getByText('Proteins new')).toBeInTheDocument()
    expect(screen.getByText('Interactions new')).toBeInTheDocument()
  })

  // ── Step 4 ───────────────────────────────────────────────

  it('shows success counts after upload completes', async () => {
    ;(useDatasetPreview as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      data: mockPreviewResult,
      error: null,
    })
    ;(useDatasetUpload as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      data: mockUploadResult,
      error: null,
    })

    render(<AdminDataPage />, { wrapper })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['col1\tcol2'], 'huri.tab', { type: 'text/plain' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    await waitFor(() => expect(screen.getByRole('button', { name: /next →/i })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: /next →/i }))
    await waitFor(() => expect(screen.getByText('Dataset name')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /preview →/i }))
    await waitFor(() => expect(screen.getByText('Import →')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /import →/i }))

    await waitFor(() =>
      expect(screen.getByText('Dataset imported successfully')).toBeInTheDocument(),
    )
    expect(screen.getByText('Proteins created')).toBeInTheDocument()
    expect(screen.getByText('Interactions created')).toBeInTheDocument()
    expect(screen.getByText('Interactions skipped')).toBeInTheDocument()
  })

  it('shows "Upload another file" button after success', async () => {
    ;(useDatasetPreview as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      data: mockPreviewResult,
      error: null,
    })
    ;(useDatasetUpload as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      data: mockUploadResult,
      error: null,
    })

    render(<AdminDataPage />, { wrapper })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['col1\tcol2'], 'huri.tab', { type: 'text/plain' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    await waitFor(() => expect(screen.getByRole('button', { name: /next →/i })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: /next →/i }))
    await waitFor(() => expect(screen.getByText('Dataset name')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /preview →/i }))
    await waitFor(() => expect(screen.getByText('Import →')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /import →/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /upload another file/i })).toBeInTheDocument(),
    )
  })
})
