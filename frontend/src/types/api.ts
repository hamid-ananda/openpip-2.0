export interface SavedNetwork {
  id: number
  name: string
  query: string
  interaction_count: number
  created_at: string | null
}

export interface AdminSettings {
  title: string
  shortTitle: string
  footer: string
  homePage: string
  missionTitle: string
  missionText: string
  methodTitle: string
  methodText: string
  mainColorScheme: string
  headerColorScheme: string
  logoColorScheme: string
  buttonColorScheme: string
  queryNodeColor: string
  interactorNodeColor: string
  publishedEdgeColor: string
  validatedEdgeColor: string
  verifiedEdgeColor: string
  literatureEdgeColor: string
  url: string
  version: string
  logoUrl?: string | null
  navStyle?: string | null
  mainColorScheme2?: string | null
  gradientAngle?: number | null
  about: string
  faq: string
  contact: string
  download: string
  showDownloads: boolean
  showDownloadAll: boolean
  example1: string
  example2: string
  example3: string
  example1Type: string
  example2Type: string
  example3Type: string
}

export interface InteractionCategory {
  id: number
  categoryName: string
  order: string
  colorScheme: string
  description: string
}

export interface Announcement {
  id: number
  title: string
  text: string
  date: string | null
  show: boolean
  showOnHomePage: boolean
}

export interface Counts {
  proteins: number
  interactions: number
  datasets: number
}

export interface DatasetRef {
  id: number
  dataset_reference: string
  dataset_author: string
  year: string
  description: string
  interaction_status: string
  name: string
}

export interface CategoryEntry {
  category_name: string
  order: number
}

export interface Protein {
  protein_id: number
  protein_uniprot_id: string
  protein_ensembl_id: string
  protein_entrez_id: string
  protein_gene_name: string
  protein_protein_name: string
  protein_description: string
  protein_sequence: string
  number_of_interactions_in_database: number
  annotation_array: Record<string, string>
  tissue_expression_array: Record<string, unknown>
  subcellular_location_expression_array: Record<string, unknown>
}

export interface Interaction {
  interaction_id: number
  interactor_A: {
    protein_id: number
    protein_uniprot_id: string
    protein_gene_name: string
    protein_ensembl_id: string
  }
  interactor_B: {
    protein_id: number
    protein_uniprot_id: string
    protein_gene_name: string
    protein_ensembl_id: string
  }
  score: number | null
  annotation_array: Record<string, string[]>
  experiment_array: unknown[]
  dataset_array: DatasetRef[]
  interaction_category_array: {
    highest_category_status: string
    highest_order: number
    interaction_category_array: CategoryEntry[]
  }
}
