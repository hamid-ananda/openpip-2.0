import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SubcellularLocationTable } from '../SubcellularLocationTable'
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

describe('SubcellularLocationTable', () => {
  it('shows empty message when no proteins have subcellular data', () => {
    const proteins = [makeProtein({ subcellular_location_expression_array: {} })]
    render(<SubcellularLocationTable proteins={proteins} />)
    expect(screen.getByText(/no subcellular location data/i)).toBeTruthy()
  })

  it('renders a row for each non-empty location', () => {
    const proteins = [
      makeProtein({
        protein_gene_name: 'BAD',
        subcellular_location_expression_array: {
          cytosol: 'approved',
          nucleus: 'enhanced',
          plasma_membrane: '',
        },
      }),
    ]
    render(<SubcellularLocationTable proteins={proteins} />)
    expect(screen.getByText(/cytosol/i)).toBeTruthy()
    expect(screen.getByText(/nucleus/i)).toBeTruthy()
    // plasma_membrane is empty — should not appear
    expect(screen.queryByText(/plasma_membrane/i)).toBeNull()
  })

  it('shows gene names for each location', () => {
    const proteins = [
      makeProtein({ protein_gene_name: 'BAD', subcellular_location_expression_array: { cytosol: 'approved' } }),
      makeProtein({ protein_id: 2, protein_gene_name: 'BCL2L1', subcellular_location_expression_array: { cytosol: 'enhanced' } }),
    ]
    render(<SubcellularLocationTable proteins={proteins} />)
    expect(screen.getByText(/BAD/)).toBeTruthy()
    expect(screen.getByText(/BCL2L1/)).toBeTruthy()
  })
})
