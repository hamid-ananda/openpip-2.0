import { http, HttpResponse } from 'msw'

// Fixture: Q92934 (BAD) → PDB 1G5J; anything else → no results
export const rcsbHandlers = [
  // PDBe best-structures API - used by useStructureAvailability
  http.get('https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/:uniprotId', ({ params }) => {
    const { uniprotId } = params as { uniprotId: string }

    if (uniprotId === 'Q92934') {
      return HttpResponse.json({
        Q92934: [{ pdb_id: '1g5j', chain_id: 'A', coverage: 0.9 }],
      })
    }

    return HttpResponse.json({})
  }),

  // AlphaFold prediction API - returns the canonical CIF URL for a UniProt ID
  http.get('https://alphafold.ebi.ac.uk/api/prediction/:uniprotId', ({ params }) => {
    const { uniprotId } = params as { uniprotId: string }
    return HttpResponse.json([
      {
        cifUrl: `https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v4.cif`,
      },
    ])
  }),
]
