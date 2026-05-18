import { http, HttpResponse } from 'msw'
import type { ProteinDetail } from '../../api/proteins'

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
  identifiers: [
    { identifier: 'BAD', naming_convention: 'gene_name' },
    { identifier: 'Q92934', naming_convention: 'uniprot' },
  ],
}

export const proteinHandlers = [
  http.get('/api/proteins/autocomplete', ({ request }) => {
    const q = new URL(request.url).searchParams.get('q') ?? ''
    return HttpResponse.json(q.length >= 2 ? ['BAD', 'BCL2', 'AKT1'] : [])
  }),
  http.get('/api/proteins/:identifier', () => HttpResponse.json(proteinFixture)),
]
