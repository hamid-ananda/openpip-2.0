import { http, HttpResponse } from 'msw'
import type { DatasetRef } from '../../types/api'
import { makeDatasetRef } from '../fixtures/datasetRef'

const datasetsFixture: DatasetRef[] = [
  makeDatasetRef({
    id: 1,
    dataset_reference: '24153252',
    dataset_author: 'Rolland et al.(2014)',
    year: '2014',
    description: 'Human Reference Interactome',
    interaction_status: 'Published',
    name: 'HuRI',
    pubmed_id: '24153252',
    author: 'Rolland et al.',
    title: 'A proteome-scale map of the human interactome network',
    journal: 'Cell',
    publication_status: 'published',
    citation:
      'Rolland et al. (2014). A proteome-scale map of the human interactome network. Cell.',
    about_body: 'A proteome-scale map of the human interactome network.',
    about_order: 1,
  }),
  makeDatasetRef({
    id: 2,
    dataset_reference: '16169070',
    dataset_author: 'Rual et al.(2005)',
    year: '2005',
    description: 'Human protein interactome screen',
    interaction_status: 'Validated',
    name: 'Y2H-II',
    pubmed_id: '16169070',
    author: 'Rual et al.',
    publication_status: 'published',
    citation: 'Rual et al. (2005).',
    about_order: 2,
  }),
  makeDatasetRef({
    id: 3,
    dataset_reference: '10490031',
    dataset_author: 'Ito et al.(2001)',
    year: '2001',
    description: 'Literature-curated binary interactions',
    interaction_status: 'Literature',
    name: 'Lit-BM',
    about_order: 3,
  }),
]

export const downloadHandlers = [
  http.get('/api/datasets', () => HttpResponse.json(datasetsFixture)),
]
