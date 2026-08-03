import { http, HttpResponse } from 'msw'
import type {
  ProteinDetail,
  ProteinInteractor,
  ProteinListRow,
} from '../../api/proteins'

const proteinFixture: ProteinDetail = {
  protein_id: 1,
  protein_gene_name: 'BAD',
  protein_protein_name: 'Bcl2-associated agonist of cell death',
  protein_uniprot_id: 'Q92934',
  protein_ensembl_id: 'ENSG00000002330',
  protein_entrez_id: '572',
  protein_description: 'Promotes cell death. Successfully competes for the binding to Bcl-X(L), Bcl-2 and Bcl-W.',
  protein_sequence: 'MRSPPPPPPGAGTARAGPGRAAGGPGSRPQPCRPPRPPAAGATSGAARAAAASAAAGTAALGSAARAAAH',
  number_of_interactions_in_database: 42,
  annotation_array: { 'Function': ['Pro-apoptotic', 'BH3 domain'] },
  tissue_expression_array: { liver: '12.4', brain: '3.1' },
  subcellular_location_expression_array: { mitochondrion: 'validated' },
  identifiers: [
    { identifier: 'BAD', naming_convention: 'gene_name' },
    { identifier: 'Q92934', naming_convention: 'uniprot' },
  ],
}

export const proteinListFixture: ProteinListRow[] = [
  {
    protein_id: 1,
    protein_gene_name: 'BAD',
    protein_protein_name: 'Bcl2-associated agonist of cell death',
    protein_uniprot_id: 'Q92934',
    number_of_interactions_in_database: 42,
    has_sequence: true,
  },
  {
    protein_id: 2,
    protein_gene_name: 'BCL2',
    protein_protein_name: 'Apoptosis regulator Bcl-2',
    protein_uniprot_id: 'P10415',
    number_of_interactions_in_database: 118,
    has_sequence: true,
  },
  {
    protein_id: 3,
    protein_gene_name: 'TP53',
    protein_protein_name: 'Cellular tumor antigen p53',
    protein_uniprot_id: 'P04637',
    number_of_interactions_in_database: 305,
    has_sequence: true,
  },
]

const interactorsFixture: ProteinInteractor[] = [
  {
    protein_id: 2,
    protein_gene_name: 'BCL2',
    protein_protein_name: 'Apoptosis regulator Bcl-2',
    protein_uniprot_id: 'P10415',
    number_of_interactions_in_database: 118,
    shared_interaction_count: 4,
  },
  {
    protein_id: 3,
    protein_gene_name: 'TP53',
    protein_protein_name: 'Cellular tumor antigen p53',
    protein_uniprot_id: 'P04637',
    number_of_interactions_in_database: 305,
    shared_interaction_count: 1,
  },
]

export const proteinHandlers = [
  http.get('/api/proteins/autocomplete', ({ request }) => {
    const q = new URL(request.url).searchParams.get('q') ?? ''
    return HttpResponse.json(q.length >= 2 ? ['BAD', 'BCL2', 'AKT1'] : [])
  }),

  http.get('/api/proteins/:identifier/interactors', () =>
    HttpResponse.json({ count: interactorsFixture.length, results: interactorsFixture })
  ),

  http.get('/api/proteins', ({ request }) => {
    const params = new URL(request.url).searchParams
    const q = (params.get('q') ?? '').toLowerCase()
    const offset = Number(params.get('offset') ?? 0)
    const limit = Number(params.get('limit') ?? 100)

    const matched = q
      ? proteinListFixture.filter(
          (row) =>
            row.protein_gene_name.toLowerCase().includes(q) ||
            row.protein_protein_name.toLowerCase().includes(q) ||
            row.protein_uniprot_id.toLowerCase().includes(q)
        )
      : proteinListFixture

    const page = matched.slice(offset, offset + limit)
    return HttpResponse.json({
      count: matched.length,
      next: offset + limit < matched.length ? `/api/proteins?offset=${offset + limit}` : null,
      previous: null,
      results: page,
    })
  }),

  http.get('/api/proteins/:identifier', ({ params }) => {
    const identifier = String(params.identifier).toUpperCase()
    const row = proteinListFixture.find(
      (entry) =>
        entry.protein_gene_name.toUpperCase() === identifier ||
        entry.protein_uniprot_id.toUpperCase() === identifier
    )
    if (!row) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({
      ...proteinFixture,
      protein_id: row.protein_id,
      protein_gene_name: row.protein_gene_name,
      protein_protein_name: row.protein_protein_name,
      protein_uniprot_id: row.protein_uniprot_id,
      number_of_interactions_in_database: row.number_of_interactions_in_database,
    })
  }),
]
