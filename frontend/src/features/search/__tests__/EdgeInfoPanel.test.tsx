import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { EdgeInfoPanel } from '../EdgeInfoPanel'
import type { Interaction } from '../../../types/api'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { makeDatasetRef } from '../../../mocks/fixtures/datasetRef'

function makeInteraction(overrides: Partial<Interaction> = {}): Interaction {
  return {
    interaction_id: 1,
    interactor_A: { protein_id: 1, protein_uniprot_id: 'Q00001', protein_gene_name: 'BAD', protein_ensembl_id: 'ENSP1' },
    interactor_B: { protein_id: 2, protein_uniprot_id: 'Q00002', protein_gene_name: 'YWHAE', protein_ensembl_id: 'ENSP2' },
    score: 0.9325,
    annotation_array: {},
    experiment_array: [],
    dataset_array: [],
    interaction_category_array: {
      highest_category_status: 'Validated',
      highest_order: 2,
      interaction_category_array: [{ category_name: 'Validated', order: 2 }],
    },
    ...overrides,
  }
}

describe('EdgeInfoPanel', () => {
  it('renders interactor gene names in the title', () => {
    renderWithProviders(<EdgeInfoPanel interaction={makeInteraction()} onClose={vi.fn()} />)
    expect(screen.getByText(/BAD.*YWHAE/)).toBeInTheDocument()
  })

  it('renders the highest category status badge', () => {
    renderWithProviders(<EdgeInfoPanel interaction={makeInteraction()} onClose={vi.fn()} />)
    expect(screen.getByText('Validated')).toBeInTheDocument()
  })

  it('renders the confidence score', () => {
    renderWithProviders(<EdgeInfoPanel interaction={makeInteraction()} onClose={vi.fn()} />)
    expect(screen.getByText('0.9325')).toBeInTheDocument()
  })

  it('does not render score section when score is null', () => {
    renderWithProviders(<EdgeInfoPanel interaction={makeInteraction({ score: null })} onClose={vi.fn()} />)
    expect(screen.queryByText(/Confidence Score/i)).toBeNull()
  })

  it('renders dataset name and status', () => {
    const ix = makeInteraction({
      dataset_array: [makeDatasetRef({
        id: 1,
        dataset_reference: 'HI-III',
        dataset_author: 'Unpublished Dataset',
        interaction_status: 'validated',
        name: 'HI-III',
      })],
    })
    renderWithProviders(<EdgeInfoPanel interaction={ix} onClose={vi.fn()} />)
    expect(screen.getByText('HI-III')).toBeInTheDocument()
    expect(screen.getByText('validated')).toBeInTheDocument()
  })

  it('renders experiment details parsed from JSON strings', () => {
    const ix = makeInteraction({
      experiment_array: [
        JSON.stringify({
          dataset: 'HI-III',
          dna_binding_domain: 'BAD',
          activation_binding_domain: 'YWHAE',
          assay_version: 1,
          num_screens: 2,
        }),
      ],
    })
    renderWithProviders(<EdgeInfoPanel interaction={ix} onClose={vi.fn()} />)
    expect(screen.getByText('HI-III')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders literature grouped by binary type', () => {
    const ix = makeInteraction({
      annotation_array: {
        litbm_interaction: [
          JSON.stringify({ pmid: '12345678', experiment_type: '0018', binary_type: 'binary' }),
        ],
      },
    })
    renderWithProviders(<EdgeInfoPanel interaction={ix} onClose={vi.fn()} />)
    expect(screen.getByText('Binary')).toBeInTheDocument()
    expect(screen.getByText('Two Hybrid')).toBeInTheDocument()
  })

  it('calls onClose when the × button is clicked', () => {
    const onClose = vi.fn()
    renderWithProviders(<EdgeInfoPanel interaction={makeInteraction()} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows "No experimental data available" when nothing is present', () => {
    renderWithProviders(<EdgeInfoPanel interaction={makeInteraction()} onClose={vi.fn()} />)
    expect(screen.getByText(/No experimental data available/i)).toBeInTheDocument()
  })
})
