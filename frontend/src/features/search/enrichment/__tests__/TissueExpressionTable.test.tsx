import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TissueExpressionTable } from '../TissueExpressionTable'
import type { Protein } from '../../../../types/api'

function makeProtein(overrides: Partial<Protein> = {}): Protein {
  return {
    protein_id: 1,
    protein_gene_name: 'BAD',
    protein_uniprot_id: 'Q92934',
    protein_ensembl_id: 'ENSG00000026103',
    protein_entrez_id: '572',
    protein_protein_name: 'BAD',
    protein_description: '',
    protein_sequence: '',
    number_of_interactions_in_database: 0,
    annotation_array: {},
    tissue_expression_array: {},
    subcellular_location_expression_array: {},
    ...overrides,
  }
}

describe('TissueExpressionTable', () => {
  it('shows empty message when no proteins have tissue data', () => {
    render(<TissueExpressionTable proteins={[makeProtein()]} />)
    expect(screen.getByText(/no tissue expression data/i)).toBeTruthy()
  })

  it('shows only tissues with expression >= 5.0 (legacy threshold)', () => {
    const proteins = [
      makeProtein({
        tissue_expression_array: {
          liver: '10.18',
          lung: '4.99',   // below threshold — should not appear
          whole_blood: '8.23',
        },
      }),
    ]
    render(<TissueExpressionTable proteins={proteins} />)
    expect(screen.getByText(/liver/i)).toBeTruthy()
    expect(screen.getByText(/whole blood/i)).toBeTruthy()
    expect(screen.queryByText(/\blung\b/i)).toBeNull()
  })

  it('strips trailing \\r from expression values', () => {
    const proteins = [
      makeProtein({
        tissue_expression_array: { liver: '10.18\r' },
      }),
    ]
    render(<TissueExpressionTable proteins={proteins} />)
    expect(screen.getByText(/liver/i)).toBeTruthy()
  })
})
