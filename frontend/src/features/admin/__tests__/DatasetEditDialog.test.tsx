import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DatasetEditDialog } from '../DatasetEditDialog'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { makeDatasetRef } from '../../../mocks/fixtures/datasetRef'

vi.mock('../../../api/datasets', () => ({
  useDatasetUpdate: vi.fn(),
  useCitationLookup: vi.fn(),
}))

import { useDatasetUpdate, useCitationLookup } from '../../../api/datasets'

const update = { mutateAsync: vi.fn(), isPending: false, isError: false, error: null }
const lookup = { mutateAsync: vi.fn(), isPending: false }

/** A dataset imported before citations existed — the case this dialog is for. */
const UNCITED = makeDatasetRef({ id: 8, name: 'HI-III', interaction_status: 'validated' })

beforeEach(() => {
  vi.clearAllMocks()
  update.mutateAsync = vi.fn().mockResolvedValue({})
  update.isPending = false
  update.isError = false
  lookup.mutateAsync = vi.fn()
  lookup.isPending = false
  vi.mocked(useDatasetUpdate).mockReturnValue(
    update as unknown as ReturnType<typeof useDatasetUpdate>
  )
  vi.mocked(useCitationLookup).mockReturnValue(
    lookup as unknown as ReturnType<typeof useCitationLookup>
  )
})

describe('DatasetEditDialog', () => {
  it('opens pre-filled with whatever the dataset already has', () => {
    const cited = makeDatasetRef({
      id: 6,
      name: 'HI-II-14',
      pubmed_id: '25416956',
      author: 'Rolland et al.',
      year: '2014',
      journal: 'Cell',
      about_body: 'The second phase of the mapping project.',
    })
    renderWithProviders(<DatasetEditDialog dataset={cited} onClose={vi.fn()} />)

    expect(screen.getByDisplayValue('25416956')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Rolland et al.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Cell')).toBeInTheDocument()
    expect(
      screen.getByDisplayValue('The second phase of the mapping project.')
    ).toBeInTheDocument()
  })

  it('saves a citation onto a dataset that had none', async () => {
    const onClose = vi.fn()
    renderWithProviders(<DatasetEditDialog dataset={UNCITED} onClose={onClose} />)

    fireEvent.change(screen.getByPlaceholderText('25416956'), {
      target: { value: '32296183' },
    })
    fireEvent.change(screen.getByPlaceholderText('Rolland et al.'), {
      target: { value: 'Luck et al.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(update.mutateAsync).toHaveBeenCalled())
    expect(update.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 8,
        patch: expect.objectContaining({ pubmed_id: '32296183', author: 'Luck et al.' }),
      })
    )
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('saves an About paragraph onto an already-loaded dataset', async () => {
    renderWithProviders(<DatasetEditDialog dataset={UNCITED} onClose={vi.fn()} />)

    fireEvent.change(
      screen.getByPlaceholderText(/Describe the screen, its search space/),
      { target: { value: 'Screens of space III.' } }
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(update.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          patch: expect.objectContaining({ about_body: 'Screens of space III.' }),
        })
      )
    )
  })

  it('fills blank fields from a PubMed lookup without overwriting typed ones', async () => {
    lookup.mutateAsync = vi.fn().mockResolvedValue({
      pubmed_id: '25416956',
      doi: '10.1016/j.cell.2014.10.050',
      title: 'A proteome-scale map of the human interactome network',
      journal: 'Cell',
      year: '2014',
      author: 'Rolland T et al.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/25416956/',
    })
    renderWithProviders(<DatasetEditDialog dataset={UNCITED} onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('25416956'), {
      target: { value: '25416956' },
    })
    // Hand-typed author must survive the lookup.
    fireEvent.change(screen.getByPlaceholderText('Rolland et al.'), {
      target: { value: 'My preferred wording' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Look up details' }))

    await waitFor(() => expect(screen.getByDisplayValue('Cell')).toBeInTheDocument())
    expect(screen.getByDisplayValue('My preferred wording')).toBeInTheDocument()
    expect(
      screen.getByDisplayValue('A proteome-scale map of the human interactome network')
    ).toBeInTheDocument()
  })

  it('reports a failed lookup rather than silently doing nothing', async () => {
    lookup.mutateAsync = vi.fn().mockRejectedValue({
      response: { data: { detail: 'No PubMed record found for 999999999.' } },
    })
    renderWithProviders(<DatasetEditDialog dataset={UNCITED} onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('25416956'), {
      target: { value: '999999999' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Look up details' }))

    expect(
      await screen.findByText('No PubMed record found for 999999999.')
    ).toBeInTheDocument()
  })

  it('asks for an identifier before looking anything up', async () => {
    renderWithProviders(<DatasetEditDialog dataset={UNCITED} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Look up details' }))

    expect(await screen.findByText('Enter a PubMed ID or a DOI first.')).toBeInTheDocument()
    expect(lookup.mutateAsync).not.toHaveBeenCalled()
  })

  it('keeps the dialog open and shows the field error when saving fails', async () => {
    update.mutateAsync = vi.fn().mockRejectedValue(new Error('nope'))
    update.isError = true
    update.error = {
      response: { data: { pubmed_id: ['A PubMed ID must be digits only, e.g. 25416956.'] } },
    } as never
    const onClose = vi.fn()
    renderWithProviders(<DatasetEditDialog dataset={UNCITED} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(
        screen.getByText(/pubmed_id: A PubMed ID must be digits only/)
      ).toBeInTheDocument()
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it('sends blanked fields so a wrong citation can be cleared', async () => {
    const wrong = makeDatasetRef({ id: 8, name: 'HI-III', pubmed_id: '12345' })
    renderWithProviders(<DatasetEditDialog dataset={wrong} onClose={vi.fn()} />)

    fireEvent.change(screen.getByDisplayValue('12345'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(update.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ patch: expect.objectContaining({ pubmed_id: '' }) })
      )
    )
  })
})
