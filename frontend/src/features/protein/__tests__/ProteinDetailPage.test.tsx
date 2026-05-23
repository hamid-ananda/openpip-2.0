import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { ProteinDetailPage } from '../ProteinDetailPage'
import { server } from '../../../mocks/server'
import { http, HttpResponse } from 'msw'

function renderAtPath(identifier: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/protein/${identifier}`]}>
        <Routes>
          <Route path="/protein/:identifier" element={<ProteinDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ProteinDetailPage', () => {
  it('shows loading state initially', () => {
    // Delay the response so loading is visible
    server.use(
      http.get('/api/proteins/:identifier', async () => {
        await new Promise((r) => setTimeout(r, 200))
        return HttpResponse.json({})
      })
    )
    renderAtPath('BAD')
    expect(screen.getByText(/loading protein/i)).toBeInTheDocument()
  })

  it('renders gene name as page heading and protein name', async () => {
    renderAtPath('BAD')
    // Gene name appears in multiple places (h1, breadcrumb, identifiers); check the heading
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'BAD' })).toBeInTheDocument()
    )
    expect(screen.getByText('Bcl2-associated agonist of cell death')).toBeInTheDocument()
  })

  it('renders identifiers section with uniprot id', async () => {
    renderAtPath('BAD')
    await waitFor(() => expect(screen.getByText('Q92934')).toBeInTheDocument())
    expect(screen.getByText('UniProt')).toBeInTheDocument()
  })

  it('renders description card', async () => {
    renderAtPath('BAD')
    await waitFor(() =>
      expect(screen.getByText(/promotes cell death/i)).toBeInTheDocument()
    )
  })

  it('renders sequence section with copy button', async () => {
    renderAtPath('BAD')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /copy fasta/i })).toBeInTheDocument()
    )
    expect(screen.getByText(/\d+ aa/)).toBeInTheDocument()
  })

  it('renders annotation chips', async () => {
    renderAtPath('BAD')
    await waitFor(() => expect(screen.getByText('Pro-apoptotic')).toBeInTheDocument())
    expect(screen.getByText('BH3 domain')).toBeInTheDocument()
  })

  it('renders external resource links', async () => {
    renderAtPath('BAD')
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /uniprot/i })).toBeInTheDocument()
    )
    expect(screen.getByRole('link', { name: /string/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /genecards/i })).toBeInTheDocument()
  })

  it('renders search interactions link', async () => {
    renderAtPath('BAD')
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /search interactions/i })).toBeInTheDocument()
    )
  })

  it('shows not found state when API returns error', async () => {
    server.use(
      http.get('/api/proteins/:identifier', () =>
        HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
      )
    )
    renderAtPath('UNKNOWN')
    await waitFor(() =>
      expect(screen.getByText('Protein not found')).toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
  })
})
