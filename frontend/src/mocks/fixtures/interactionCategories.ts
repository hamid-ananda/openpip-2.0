import type { InteractionCategory } from '../../types/api'

export const interactionCategoriesFixture: InteractionCategory[] = [
  {
    id: 1,
    categoryName: 'Literature',
    order: '1',
    colorScheme: '#0ea5e9',
    description:
      'Include interactions that were curated from small-scale studies with at least two experimental evidences of which at least one stems from a binary interaction detection assay.',
  },
  {
    id: 2,
    categoryName: 'HI-Union',
    order: '3',
    colorScheme: '#7c3aed',
    description:
      'Include all interactions from datasets that are published with an associated publication.',
  },
]
