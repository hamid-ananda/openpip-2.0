import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminFilePage } from '../AdminFilePage'
import {
  useAdminFiles,
  useUploadFile,
  useToggleFileVisibility,
  useDeleteFile,
} from '../../../api/files'

vi.mock('../../../api/files', () => ({
  useAdminFiles: vi.fn(),
  useUploadFile: vi.fn(),
  useToggleFileVisibility: vi.fn(),
  useDeleteFile: vi.fn(),
}))

const mutate = vi.fn()

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  mutate.mockReset()
  ;(useAdminFiles as ReturnType<typeof vi.fn>).mockReturnValue({ data: [], isLoading: false })
  ;(useUploadFile as ReturnType<typeof vi.fn>).mockReturnValue({ mutate, isPending: false })
  ;(useToggleFileVisibility as ReturnType<typeof vi.fn>).mockReturnValue({ mutate: vi.fn(), isPending: false })
  ;(useDeleteFile as ReturnType<typeof vi.fn>).mockReturnValue({ mutate: vi.fn(), isPending: false })
})

describe('AdminFilePage', () => {
  // ── render ──────────────────────────────────────────────

  it('renders the page heading', () => {
    render(<AdminFilePage />, { wrapper })
    expect(screen.getByText('File Manager')).toBeInTheDocument()
  })

  it('shows empty state when no files exist', () => {
    render(<AdminFilePage />, { wrapper })
    expect(screen.getByText('No files uploaded yet.')).toBeInTheDocument()
  })

  // ── upload ───────────────────────────────────────────────

  it('shows success banner after valid file upload', async () => {
    mutate.mockImplementation((_form: FormData, opts?: { onSuccess?: () => void }) =>
      opts?.onSuccess?.()
    )
    render(<AdminFilePage />, { wrapper })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, {
      target: { files: [new File(['col1\tcol2\nA\tB\n'], 'test.tab', { type: 'text/plain' })] },
    })
    await waitFor(() =>
      expect(screen.getByText(/uploaded successfully/i)).toBeInTheDocument()
    )
  })

  it('shows error banner for disallowed extension', async () => {
    render(<AdminFilePage />, { wrapper })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, {
      target: { files: [new File(['print("hi")'], 'script.py', { type: 'text/plain' })] },
    })
    await waitFor(() =>
      expect(screen.getByText(/not allowed/i)).toBeInTheDocument()
    )
  })

  it('shows collision dialog when file already exists', async () => {
    ;(useAdminFiles as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [{ id: 1, file_name: 'existing.tab', file_size: 16, show: true, uploaded_at: '2024-01-01T00:00:00Z' }],
      isLoading: false,
    })
    render(<AdminFilePage />, { wrapper })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, {
      target: { files: [new File(['data'], 'existing.tab', { type: 'text/plain' })] },
    })
    await waitFor(() =>
      expect(screen.getByText('File already exists')).toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: /upload anyway/i })).toBeInTheDocument()
  })

  // ── file list actions ────────────────────────────────────

  it('shows file in the list after upload (success banner contains file name)', async () => {
    mutate.mockImplementation((_form: FormData, opts?: { onSuccess?: () => void }) =>
      opts?.onSuccess?.()
    )
    render(<AdminFilePage />, { wrapper })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, {
      target: { files: [new File(['data'], 'proteins.tab', { type: 'text/plain' })] },
    })
    await waitFor(() => expect(screen.getByText(/uploaded successfully/i)).toBeInTheDocument())
    expect(screen.getByText('proteins.tab')).toBeInTheDocument()
  })
})
