import { http, HttpResponse } from 'msw'
import type { DatasetRef } from '../../types/api'

const datasetsFixture: DatasetRef[] = [
  {
    id: 1,
    dataset_reference: '24153252',
    dataset_author: 'Rolland et al.(2014)',
    year: '2014',
    description: 'Human Reference Interactome',
    interaction_status: 'Published',
    name: 'HuRI',
  },
  {
    id: 2,
    dataset_reference: '16169070',
    dataset_author: 'Rual et al.(2005)',
    year: '2005',
    description: 'Human protein interactome screen',
    interaction_status: 'Validated',
    name: 'Y2H-II',
  },
  {
    id: 3,
    dataset_reference: '10490031',
    dataset_author: 'Ito et al.(2001)',
    year: '2001',
    description: 'Literature-curated binary interactions',
    interaction_status: 'Literature',
    name: 'Lit-BM',
  },
]

export const downloadHandlers = [
  http.get('/api/datasets', () => HttpResponse.json(datasetsFixture)),
]
