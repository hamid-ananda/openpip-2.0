import type { ReactElement } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProteinsPage } from '../ProteinsPage'
import { LegacyProteinRedirect } from '../LegacyProteinRedirect'

function renderPage(route = '/proteins') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const routes: ReactElement = (
    <Routes>
      <Route path="/proteins" element={<ProteinsPage />} />
      <Route path="/proteins/:identifier" element={<ProteinsPage />} />
      <Route path="/protein/:identifier" element={<LegacyProteinRedirect />} />
      <Route path="/search/:term" element={<div>network view</div>} />
    </Routes>
  )
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{routes}</MemoryRouter>
    </QueryClientProvider>
  )
}

/** The scrollable list of proteins in the left sidebar. */
function list() {
  return screen.getByRole('listbox', { name: /protein list/i })
}

/** The detail pane on the right. Scoping matters: gene and protein names
 *  appear in both the sidebar row and the detail header. */
function detail() {
  return screen.getByRole('region', { name: /protein details/i })
}

describe('ProteinsPage', () => {
  it('lists every protein and shows how many matched', async () => {
    renderPage()

    await waitFor(() => expect(within(list()).getByText('BAD')).toBeInTheDocument())
    expect(within(list()).getByText('BCL2')).toBeInTheDocument()
    expect(within(list()).getByText('TP53')).toBeInTheDocument()
    expect(screen.getByText('Showing 3 of 3')).toBeInTheDocument()
  })

  it('prompts the user to choose a protein when none is selected', async () => {
    renderPage()
    expect(await screen.findByText('Select a protein')).toBeInTheDocument()
  })

  it('narrows the list to matching proteins as the user searches', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(within(list()).getByText('BAD')).toBeInTheDocument())

    await user.type(screen.getByRole('searchbox', { name: /search proteins/i }), 'TP53')

    await waitFor(() => expect(screen.getByText('Showing 1 of 1')).toBeInTheDocument())
    expect(within(list()).getByText('TP53')).toBeInTheDocument()
    expect(within(list()).queryByText('BAD')).not.toBeInTheDocument()
  })

  it('restores the full list when the clear button is pressed', async () => {
    const user = userEvent.setup()
    renderPage()
    const searchBox = screen.getByRole('searchbox', { name: /search proteins/i })

    await user.type(searchBox, 'TP53')
    await waitFor(() => expect(screen.getByText('Showing 1 of 1')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /clear search/i }))

    expect(searchBox).toHaveValue('')
    await waitFor(() => expect(within(list()).getByText('BAD')).toBeInTheDocument())
  })

  it('shows the clear button only while there is a search term', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()
    await user.type(screen.getByRole('searchbox', { name: /search proteins/i }), 'TP')
    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument()
  })

  it('opens a protein and renders its details when a row is clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(within(list()).getByText('TP53')).toBeInTheDocument())

    await user.click(within(list()).getByText('TP53'))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'TP53' })
    ).toBeInTheDocument()
    expect(within(detail()).getByText('Cellular tumor antigen p53')).toBeInTheDocument()
    expect(within(detail()).getByText('Identifiers')).toBeInTheDocument()
  })

  it('renders the protein named in the URL on first load', async () => {
    renderPage('/proteins/BCL2')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'BCL2' })
    ).toBeInTheDocument()
  })

  it('reports a protein that does not exist', async () => {
    renderPage('/proteins/NOTAPROTEIN')

    expect(await screen.findByText('Protein not found')).toBeInTheDocument()
    expect(screen.getByText(/No protein matched NOTAPROTEIN/)).toBeInTheDocument()
  })

  it('moves through the list with the arrow keys and opens with Enter', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(within(list()).getByText('BAD')).toBeInTheDocument())

    list().focus()
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'BCL2' })
    ).toBeInTheDocument()
  })

  it('focuses the search box when / is pressed', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(within(list()).getByText('BAD')).toBeInTheDocument())

    list().focus()
    await user.keyboard('/')

    expect(screen.getByRole('searchbox', { name: /search proteins/i })).toHaveFocus()
  })

  it('links a selected protein through to its interaction network', async () => {
    renderPage('/proteins/TP53')

    const link = await screen.findByRole('link', { name: /view interaction network/i })
    expect(link).toHaveAttribute('href', '/search/TP53')
  })

  it('offers clickable interactors that open the neighbouring protein', async () => {
    const user = userEvent.setup()
    renderPage('/proteins/BAD')
    await screen.findByRole('heading', { level: 1, name: 'BAD' })

    const interactor = await screen.findByRole('button', { name: /BCL2/ })
    await user.click(interactor)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'BCL2' })
    ).toBeInTheDocument()
  })

  it('shows computed sequence properties alongside the interaction count', async () => {
    renderPage('/proteins/BAD')
    await screen.findByRole('heading', { level: 1, name: 'BAD' })

    const pane = within(detail())
    expect(pane.getByText('Interactions')).toBeInTheDocument()
    expect(pane.getByText('Residues')).toBeInTheDocument()
    expect(pane.getByText('Mol. weight')).toBeInTheDocument()
    expect(pane.getByText('Isoelectric pt')).toBeInTheDocument()
    expect(pane.getByText('70')).toBeInTheDocument() // fixture sequence length
  })

  it('keeps the search term in the URL when a protein is opened', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByRole('searchbox', { name: /search proteins/i }), 'TP53')
    await waitFor(() => expect(within(list()).getByText('TP53')).toBeInTheDocument())

    await user.click(within(list()).getByText('TP53'))

    await screen.findByRole('heading', { level: 1, name: 'TP53' })
    // The sidebar keeps filtering to the same term after navigating.
    expect(screen.getByRole('searchbox', { name: /search proteins/i })).toHaveValue('TP53')
  })

  it('redirects the superseded /protein/:identifier route', async () => {
    renderPage('/protein/TP53')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'TP53' })
    ).toBeInTheDocument()
  })
})
