import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DatasetCitations } from '../DatasetCitations'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { makeDatasetRef } from '../../../mocks/fixtures/datasetRef'

vi.mock('../../../api/downloads', () => ({
  useDatasets: vi.fn(),
}))

import { useDatasets } from '../../../api/downloads'

function mockDatasets(datasets: unknown[], isLoading = false) {
  vi.mocked(useDatasets).mockReturnValue({
    data: datasets,
    isLoading,
  } as unknown as ReturnType<typeof useDatasets>)
}

const HURI = makeDatasetRef({
  id: 1,
  name: 'HuRI',
  pubmed_id: '32296183',
  author: 'Luck et al.',
  year: '2020',
  publication_status: 'published',
  citation: 'Luck et al. (2020). A reference map of the human binary protein interactome. Nature.',
  about_body: 'The third phase of the human interactome mapping project.',
  number_of_interactions: '52569',
  about_order: 1,
})

describe('DatasetCitations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders a heading, paragraph and citation for each dataset', async () => {
    mockDatasets([HURI])
    renderWithProviders(<DatasetCitations heading="Data sources and citations" />)

    expect(await screen.findByText('Data sources and citations')).toBeInTheDocument()
    expect(screen.getByText('HuRI')).toBeInTheDocument()
    expect(
      screen.getByText('The third phase of the human interactome mapping project.')
    ).toBeInTheDocument()
    expect(screen.getByText(/Luck et al\. \(2020\)/)).toBeInTheDocument()
  })

  it('links a PubMed ID out to PubMed', async () => {
    mockDatasets([HURI])
    renderWithProviders(<DatasetCitations heading="Sources" />)

    const link = await screen.findByRole('link', { name: 'PubMed 32296183' })
    expect(link).toHaveAttribute('href', 'https://pubmed.ncbi.nlm.nih.gov/32296183/')
  })

  it('prefers a DOI link when one is recorded', async () => {
    mockDatasets([makeDatasetRef({ ...HURI, doi: '10.1038/s41586-020-2188-x' })])
    renderWithProviders(<DatasetCitations heading="Sources" />)

    const link = await screen.findByRole('link', { name: 'doi:10.1038/s41586-020-2188-x' })
    expect(link).toHaveAttribute('href', 'https://doi.org/10.1038/s41586-020-2188-x')
  })

  it('says so when a dataset has no citation instead of leaving a gap', async () => {
    mockDatasets([makeDatasetRef({ id: 9, name: 'Test-Space' })])
    renderWithProviders(<DatasetCitations heading="Sources" />)

    expect(await screen.findByText(/Unpublished dataset/)).toBeInTheDocument()
  })

  it('orders datasets by about_order', async () => {
    mockDatasets([
      makeDatasetRef({ id: 1, name: 'Third', about_order: 3 }),
      makeDatasetRef({ id: 2, name: 'First', about_order: 1 }),
      makeDatasetRef({ id: 3, name: 'Second', about_order: 2 }),
    ])
    renderWithProviders(<DatasetCitations heading="Sources" />)

    await screen.findByText('First')
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['First', 'Second', 'Third'])
  })

  it('hides datasets an admin has unticked', async () => {
    mockDatasets([
      makeDatasetRef({ id: 1, name: 'Shown' }),
      makeDatasetRef({ id: 2, name: 'Hidden', show_on_about: false }),
    ])
    renderWithProviders(<DatasetCitations heading="Sources" />)

    await screen.findByText('Shown')
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })

  it('uses about_heading when the admin set one', async () => {
    mockDatasets([makeDatasetRef({ id: 1, name: 'HI-III', about_heading: 'Space III screens' })])
    renderWithProviders(<DatasetCitations heading="Sources" />)

    expect(await screen.findByText('Space III screens')).toBeInTheDocument()
    expect(screen.queryByText('HI-III')).not.toBeInTheDocument()
  })

  it('renders nothing while loading or when there are no datasets', async () => {
    mockDatasets([], true)
    const { container } = renderWithProviders(<DatasetCitations heading="Sources" />)
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })
})
