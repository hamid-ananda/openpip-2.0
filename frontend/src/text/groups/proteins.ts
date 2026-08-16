import type { TextGroup } from '../types'

export const proteinsGroup: TextGroup = {
  id: 'proteins',
  label: 'Protein browser',
  route: '/proteins',
  description: 'Copy on the browsable protein catalogue at /proteins.',
  entries: [
    {
      key: 'proteins.sortLabel',
      label: 'Sort control label',
      section: 'Sidebar',
      default: 'Sort',
    },
    {
      key: 'proteins.resultCount',
      label: 'Result count',
      section: 'Sidebar',
      default: 'Showing {shown} of {total}',
      hint: '{shown} is the number loaded so far; {total} is the full match count.',
    },
    {
      key: 'proteins.keyboardHint',
      label: 'Keyboard hint',
      section: 'Sidebar',
      default: '/ to search · ↑ ↓ to move · Enter to open',
    },

    {
      key: 'proteins.emptyTitle',
      label: 'Nothing selected: heading',
      section: 'Empty & not-found states',
      default: 'Select a protein',
    },
    {
      key: 'proteins.emptyBody',
      label: 'Nothing selected: body',
      section: 'Empty & not-found states',
      default:
        'Pick a protein from the list to see its identifiers, annotations, sequence, and 3D structure.',
    },
    {
      key: 'proteins.notFoundTitle',
      label: 'Not found: heading',
      section: 'Empty & not-found states',
      default: 'Protein not found',
    },
    {
      key: 'proteins.notFoundBody',
      label: 'Not found: body',
      section: 'Empty & not-found states',
      default: 'No protein matched {identifier}.',
    },

    {
      key: 'proteins.viewNetwork',
      label: 'View network button',
      section: 'Detail panel',
      default: 'View interaction network →',
    },
    {
      key: 'proteins.statInteractions',
      label: 'Stat: interactions',
      section: 'Detail panel',
      default: 'Interactions',
    },
    {
      key: 'proteins.statLength',
      label: 'Stat: length',
      section: 'Detail panel',
      default: 'Residues',
    },
    {
      key: 'proteins.statWeight',
      label: 'Stat: molecular weight',
      section: 'Detail panel',
      default: 'Mol. weight',
    },
    {
      key: 'proteins.statPi',
      label: 'Stat: isoelectric point',
      section: 'Detail panel',
      default: 'Isoelectric pt',
    },
    {
      key: 'proteins.sectionIdentifiers',
      label: 'Section: identifiers',
      section: 'Detail panel',
      default: 'Identifiers',
    },
    {
      key: 'proteins.sectionDescription',
      label: 'Section: description',
      section: 'Detail panel',
      default: 'Description',
    },
    {
      key: 'proteins.sectionInteractors',
      label: 'Section: interactors',
      section: 'Detail panel',
      default: 'Top interactors',
    },
    {
      key: 'proteins.sectionAnnotations',
      label: 'Section: annotations',
      section: 'Detail panel',
      default: 'Annotations',
    },
    {
      key: 'proteins.sectionTissue',
      label: 'Section: tissue expression',
      section: 'Detail panel',
      default: 'Tissue expression',
    },
    {
      key: 'proteins.sectionSubcellular',
      label: 'Section: subcellular location',
      section: 'Detail panel',
      default: 'Subcellular location',
    },
    {
      key: 'proteins.sectionSequence',
      label: 'Section: sequence',
      section: 'Detail panel',
      default: 'Sequence',
    },
    {
      key: 'proteins.sectionExternal',
      label: 'Section: external databases',
      section: 'Detail panel',
      default: 'External databases',
    },
    {
      key: 'proteins.sectionExport',
      label: 'Section: export',
      section: 'Detail panel',
      default: 'Export this record',
    },
    {
      key: 'proteins.sectionStructure',
      label: 'Section: 3D structure',
      section: 'Detail panel',
      default: '3D structure',
    },

    {
      key: 'proteins.interactorsFooter',
      label: 'Footer',
      section: 'Interactors',
      default: 'Showing the {shown} best-supported of {total} interactors.',
    },
    {
      key: 'proteins.noInteractors',
      label: 'No interactors',
      section: 'Interactors',
      default: 'No interactions recorded for this protein.',
    },

    {
      key: 'proteins.copyFasta',
      label: 'Copy FASTA button',
      section: 'Sequence & export',
      default: 'Copy FASTA',
    },
    {
      key: 'proteins.downloadFasta',
      label: 'Download FASTA button',
      section: 'Sequence & export',
      default: 'Download FASTA',
    },
    {
      key: 'proteins.showComposition',
      label: 'Show composition button',
      section: 'Sequence & export',
      default: 'Amino-acid composition',
    },
    {
      key: 'proteins.hideComposition',
      label: 'Hide composition button',
      section: 'Sequence & export',
      default: 'Hide composition',
    },
    {
      key: 'proteins.blast',
      label: 'BLAST link',
      section: 'Sequence & export',
      default: 'BLAST at NCBI ↗',
    },
    {
      key: 'proteins.exportJson',
      label: 'Export JSON button',
      section: 'Sequence & export',
      default: 'Download JSON',
    },
    {
      key: 'proteins.exportTsv',
      label: 'Export TSV button',
      section: 'Sequence & export',
      default: 'Download TSV',
    },

    {
      key: 'proteins.view3d',
      label: 'View toggle: 3D',
      section: '3D structure',
      default: '3D model',
    },
    {
      key: 'proteins.viewPae',
      label: 'View toggle: PAE',
      section: '3D structure',
      default: 'PAE plot',
    },
    {
      key: 'proteins.paeExplainer',
      label: 'PAE explainer',
      section: '3D structure',
      default:
        'Darker shading means AlphaFold is more confident about the relative position of that pair of residues. Blocks along the diagonal are well-packed domains; bright off-diagonal regions mean the domains move independently.',
    },
    {
      key: 'proteins.paeData',
      label: 'PAE data download',
      section: '3D structure',
      default: 'PAE data (JSON)',
    },
    {
      key: 'proteins.modelConfidence',
      label: 'Model confidence heading',
      section: '3D structure',
      default: 'Model confidence',
    },
    {
      key: 'proteins.meanPlddt',
      label: 'Mean pLDDT caption',
      section: '3D structure',
      default: 'mean pLDDT',
    },
    {
      key: 'proteins.plddtNote',
      label: 'pLDDT legend note',
      section: '3D structure',
      default: 'The model is coloured by these bands in the viewer.',
    },
    {
      key: 'proteins.modelDetails',
      label: 'Model details heading',
      section: '3D structure',
      default: 'Model details',
    },
    {
      key: 'proteins.modelId',
      label: 'Model field: id',
      section: '3D structure',
      default: 'Entry',
    },
    {
      key: 'proteins.modelVersion',
      label: 'Model field: version',
      section: '3D structure',
      default: 'Version',
    },
    {
      key: 'proteins.modelDate',
      label: 'Model field: created',
      section: '3D structure',
      default: 'Released',
    },
    {
      key: 'proteins.modelResidues',
      label: 'Model field: residue range',
      section: '3D structure',
      default: 'Residues',
    },
    {
      key: 'proteins.modelOrganism',
      label: 'Model field: organism',
      section: '3D structure',
      default: 'Organism',
    },
    {
      key: 'proteins.modelTool',
      label: 'Model field: pipeline',
      section: '3D structure',
      default: 'Pipeline',
    },
    {
      key: 'proteins.modelDownloads',
      label: 'Model downloads heading',
      section: '3D structure',
      default: 'Download',
    },
    {
      key: 'proteins.openAlphafold',
      label: 'AlphaFold link',
      section: '3D structure',
      default: 'AlphaFold DB ↗',
    },
    {
      key: 'proteins.openRcsb',
      label: 'RCSB link',
      section: '3D structure',
      default: 'RCSB PDB ↗',
    },
    {
      key: 'proteins.noAlphafoldModel',
      label: 'No AlphaFold model',
      section: '3D structure',
      default: 'No AlphaFold model is available for this accession.',
    },
    {
      key: 'proteins.experimentalStructure',
      label: 'Experimental structure heading',
      section: '3D structure',
      default: 'Experimental structure',
    },
    {
      key: 'proteins.pdbExplainer',
      label: 'PDB explainer',
      section: '3D structure',
      default:
        'Solved experimentally and deposited in the PDB as {pdbId}. Unlike a prediction this carries no per-residue confidence score, but it may cover only part of the sequence.',
    },
    {
      key: 'proteins.structureNonePdb',
      label: 'Structure caption: no PDB entry',
      section: '3D structure',
      default: 'No experimental structure found in PDB.',
    },
    {
      key: 'proteins.structureNoUniprot',
      label: 'Structure caption: no accession',
      section: '3D structure',
      default: 'No UniProt accession, so a 3D structure cannot be resolved.',
    },

    // Chrome: placeholders, transient states, tooltips, and accessible labels.
    {
      key: 'proteins.searchPlaceholder',
      label: 'Search placeholder',
      default: 'Search proteins…',
    },
    {
      key: 'proteins.searchLabel',
      label: 'Search field label',
      default: 'Search proteins',
    },
    {
      key: 'proteins.clearSearch',
      label: 'Clear search button',
      default: 'Clear search',
    },
    {
      key: 'proteins.listLabel',
      label: 'List landmark label',
      default: 'Protein list',
    },
    {
      key: 'proteins.detailLabel',
      label: 'Detail landmark label',
      default: 'Protein details',
    },
    {
      key: 'proteins.loadingList',
      label: 'List loading',
      default: 'Loading proteins…',
    },
    {
      key: 'proteins.loadingMore',
      label: 'Loading more rows',
      default: 'Loading more…',
    },
    {
      key: 'proteins.noResults',
      label: 'No matches',
      default: 'No proteins match that search.',
    },
    {
      key: 'proteins.listError',
      label: 'List error',
      default: 'Could not load the protein list.',
    },
    {
      key: 'proteins.interactionsTitle',
      label: 'Row count tooltip',
      default: 'Interactions in database',
    },
    {
      key: 'proteins.detailLoading',
      label: 'Detail loading',
      default: 'Loading protein…',
    },
    {
      key: 'proteins.interactorsLoading',
      label: 'Interactors loading',
      default: 'Loading interactors…',
    },
    {
      key: 'proteins.interactorTitle',
      label: 'Interactor button tooltip',
      default: 'Open {gene}',
    },
    { key: 'proteins.copied', label: 'Copy confirmation', default: 'Copied!' },
    {
      key: 'proteins.paeTitle',
      label: 'PAE toggle tooltip',
      default:
        'Predicted Aligned Error: how confident the model is about relative domain positions',
    },
    {
      key: 'proteins.paeAlt',
      label: 'PAE image alt text',
      default: 'Predicted aligned error plot',
    },
    {
      key: 'proteins.modelLoading',
      label: 'Model metadata loading',
      default: 'Loading model…',
    },
  ],
}
