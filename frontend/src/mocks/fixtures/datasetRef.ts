import type { DatasetRef } from '../../types/api'

/**
 * Build a DatasetRef for fixtures and tests.
 *
 * DatasetRef grew citation and About-page fields that every API response
 * carries but almost no test cares about; this keeps fixtures to the fields
 * that matter to the case under test.
 */
export function makeDatasetRef(overrides: Partial<DatasetRef> = {}): DatasetRef {
  return {
    id: 1,
    dataset_reference: '',
    dataset_author: 'Unpublished Dataset',
    year: '',
    description: '',
    interaction_status: 'Published',
    name: 'Dataset',
    number_of_interactions: null,
    citation: null,
    pubmed_id: null,
    author: null,
    title: null,
    journal: null,
    doi: null,
    url: null,
    publication_status: 'unpublished',
    about_heading: null,
    about_body: null,
    show_on_about: true,
    about_order: 0,
    ...overrides,
  }
}
