/**
 * Display names for the tissue_expression annotation keys.
 *
 * These are transcribed from `annotation_type.fields` in the database, which
 * has carried them since legacy but stores them inverted ({label: key}) and is
 * exposed by no API. The set is frozen: nothing in openPIP or in legacy — admin
 * UI, CLI or script — can create or refresh a tissue expression annotation, so
 * a fetch would spend a round trip on 36 constants that cannot change. If a
 * future dataset ever brings its own tissues, read the column instead.
 *
 * brain_0/1/2 are the reason this exists. They are YARN's PCoA clusters, not an
 * ordering anyone chose by hand, so underscore-prettifying them produced
 * "Brain 0 / 1 / 2" on screen — meaningless to a biologist. See
 * docs/DATA_PROVENANCE_QUESTIONS.md §5.
 */
export const TISSUE_LABELS: Record<string, string> = {
  adipose_subcutaneous: 'Adipose Subcutaneous',
  adipose_visceral_omentum: 'Adipose Visceral Omentum',
  adrenal_gland: 'Adrenal Gland',
  artery_aorta: 'Artery Aorta',
  artery_coronary: 'Artery Coronary',
  artery_tibial: 'Artery Tibial',
  brain_0: 'Brain basal ganglia',
  brain_1: 'Brain cerebellum',
  brain_2: 'Brain other',
  breast_mammary_tissue: 'Breast Mammary Tissue',
  colon_sigmoid: 'Colon Sigmoid',
  colon_transverse: 'Colon Transverse',
  esophagus_gastroesophageal_junction: 'Esophagus Gastroesophageal Junction',
  esophagus_mucosa: 'Esophagus Mucosa',
  esophagus_muscularis: 'Esophagus Muscularis',
  heart_atrial_appendage: 'Heart Atrial Appendage',
  heart_left_ventricle: 'Heart Left Ventricle',
  kidney_cortex: 'Kidney Cortex',
  liver: 'Liver',
  lung: 'Lung',
  minor_salivary_gland: 'Minor Salivary Gland',
  muscle_skeletal: 'Muscle Skeletal',
  nerve_tibial: 'Nerve Tibial',
  ovary: 'Ovary',
  pancreas: 'Pancreas',
  pituitary: 'Pituitary',
  prostate: 'Prostate',
  skin: 'Skin',
  small_intestine_terminal_ileum: 'Small Intestine Terminal Ileum',
  spleen: 'Spleen',
  stomach: 'Stomach',
  testis: 'Testis',
  thyroid: 'Thyroid',
  uterus: 'Uterus',
  vagina: 'Vagina',
  whole_blood: 'Whole Blood',
}

/** Every tissue key openPIP holds, in the order the filter dropdown lists them. */
export const TISSUE_KEYS = Object.keys(TISSUE_LABELS)

/**
 * A tissue key's display name. Falls back to prettifying the key, so a dataset
 * that arrives with tissues we have no label for still reads sensibly.
 */
export function tissueLabel(key: string): string {
  return (
    TISSUE_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}
