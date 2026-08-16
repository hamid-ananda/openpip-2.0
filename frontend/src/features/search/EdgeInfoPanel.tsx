import type { Interaction } from '../../types/api'
import { useText } from '../../text'
import { referenceHref, referenceLabel, shortCitation } from '../../lib/citation'

// PSI-MI experiment type code → human-readable label (subset covering common codes)
const EXPERIMENT_TYPES: Record<string, string> = {
  '0018': 'Two Hybrid',
  '0397': 'Two Hybrid Array',
  '0398': 'Two Hybrid Pooling Approach',
  '0399': 'Two Hybrid Fragment Pooling Approach',
  '1356': 'Validated Two Hybrid',
  '0019': 'Co-immunoprecipitation',
  '0096': 'Pull Down',
  '0059': 'GST Pull Down',
  '0065': 'Isothermal Titration Calorimetry',
  '0107': 'Surface Plasmon Resonance',
  '0676': 'Tandem Affinity Purification',
  '0006': 'Anti Bait Co-immunoprecipitation',
  '0007': 'Anti Tag Co-immunoprecipitation',
  '0729': 'Luminescence-based Mammalian Interactome Mapping',
  '0231': 'Mammalian Protein Protein Interaction Trap',
}

interface ExperimentEntry {
  dataset?: string
  dna_binding_domain?: string
  activation_binding_domain?: string
  orf_A_id?: string
  orf_B_id?: string
  assay_version?: number
  num_screens?: number
}

interface LitEntry {
  pmid?: string
  experiment_type?: string
  binary_type?: string
}

const SECTION = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '.07em',
  marginBottom: 6,
  marginTop: 14,
}

export interface EdgeInfoPanelProps {
  interaction: Interaction
  onClose: () => void
}

export function EdgeInfoPanel({ interaction, onClose }: EdgeInfoPanelProps) {
  const t = useText()
  const geneA = interaction.interactor_A.protein_gene_name || interaction.interactor_A.protein_uniprot_id
  const geneB = interaction.interactor_B.protein_gene_name || interaction.interactor_B.protein_uniprot_id
  const { highest_category_status } = interaction.interaction_category_array

  const experiments: ExperimentEntry[] = interaction.experiment_array.flatMap((raw) => {
    try { return [JSON.parse(raw) as ExperimentEntry] } catch { return [] }
  })

  const litEntries: LitEntry[] = (interaction.annotation_array['litbm_interaction'] ?? []).flatMap((raw) => {
    try { return [JSON.parse(raw) as LitEntry] } catch { return [] }
  })

  // Group literature by binary_type, deduplicate PMIDs per group
  const binaryPmids: string[] = []
  const nonBinaryPmids: string[] = []
  const binaryTypes = new Set<string>()
  const nonBinaryTypes = new Set<string>()

  for (const lit of litEntries) {
    const pmid = lit.pmid ?? ''
    const label = lit.experiment_type ? (EXPERIMENT_TYPES[lit.experiment_type] ?? lit.experiment_type) : ''
    if (lit.binary_type === 'binary') {
      if (pmid && !binaryPmids.includes(pmid)) binaryPmids.push(pmid)
      if (label) binaryTypes.add(label)
    } else {
      if (pmid && !nonBinaryPmids.includes(pmid)) nonBinaryPmids.push(pmid)
      if (label) nonBinaryTypes.add(label)
    }
  }

  const hasExperiments = experiments.length > 0
  const hasLiterature = litEntries.length > 0
  const hasDatasets = interaction.dataset_array.length > 0

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 20,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '16px 18px',
        width: 292,
        boxShadow: '0 6px 24px rgba(0,0,0,.14)',
        maxHeight: 'calc(100% - 24px)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, paddingRight: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, wordBreak: 'break-word' }}>
            {geneA} ↔ {geneB}
          </div>
          <div style={{
            marginTop: 4,
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--accent)',
            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
            borderRadius: 4,
            padding: '1px 7px',
          }}>
            {highest_category_status}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label={t('search.panel.close')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 18,
            lineHeight: 1,
            flexShrink: 0,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Score */}
      {interaction.score !== null && interaction.score !== undefined && (
        <>
          <div style={SECTION}>{t('search.edge.score')}</div>
          <div style={{ fontSize: 13, color: 'var(--text)' }}>
            {interaction.score.toFixed(4)}
          </div>
        </>
      )}

      {/* Datasets */}
      {hasDatasets && (
        <>
          <div style={SECTION}>{t('search.edge.datasets')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {interaction.dataset_array.map((ds, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text)' }}>
                <span style={{ fontWeight: 600 }}>{ds.name}</span>
                {shortCitation(ds) && (
                  <span style={{ color: 'var(--text-muted)' }}> · {shortCitation(ds)}</span>
                )}
                {referenceHref(ds) && (
                  <a
                    href={referenceHref(ds)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: 6, color: 'var(--primary)', textDecoration: 'none' }}
                    title={ds.citation ?? undefined}
                  >
                    {referenceLabel(ds)}
                  </a>
                )}
                {ds.interaction_status && (
                  <span style={{
                    marginLeft: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}>
                    {ds.interaction_status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Experiments */}
      {hasExperiments && (
        <>
          <div style={SECTION}>{t('search.edge.experiments')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {experiments.map((exp, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  color: 'var(--text)',
                  background: 'var(--bg)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                {exp.dataset && (
                  <div><span style={{ color: 'var(--text-muted)' }}>{t('search.edge.dataset')} </span>{exp.dataset}</div>
                )}
                {exp.dna_binding_domain && (
                  <div><span style={{ color: 'var(--text-muted)' }}>{t('search.edge.dbDomain')} </span>{exp.dna_binding_domain}</div>
                )}
                {exp.activation_binding_domain && (
                  <div><span style={{ color: 'var(--text-muted)' }}>{t('search.edge.ad')} </span>{exp.activation_binding_domain}</div>
                )}
                {exp.assay_version !== undefined && (
                  <div><span style={{ color: 'var(--text-muted)' }}>{t('search.edge.assayVersion')} </span>{exp.assay_version}</div>
                )}
                {exp.num_screens !== undefined && (
                  <div><span style={{ color: 'var(--text-muted)' }}>{t('search.edge.screens')} </span>{exp.num_screens}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Literature */}
      {hasLiterature && (
        <>
          <div style={SECTION}>{t('search.edge.literature')}</div>
          {binaryPmids.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 3 }}>{t('search.edge.binary')}</div>
              {Array.from(binaryTypes).map((label) => (
                <div key={label} style={{ fontSize: 12 }}>
                  <a
                    href={`https://www.ncbi.nlm.nih.gov/pubmed/?term=${binaryPmids.join('+')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    {label}
                  </a>
                </div>
              ))}
            </div>
          )}
          {nonBinaryPmids.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 3 }}>{t('search.edge.nonBinary')}</div>
              {Array.from(nonBinaryTypes).map((label) => (
                <div key={label} style={{ fontSize: 12 }}>
                  <a
                    href={`https://www.ncbi.nlm.nih.gov/pubmed/?term=${nonBinaryPmids.join('+')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    {label}
                  </a>
                </div>
              ))}
            </div>
          )}
          {/* Fallback when binary_type is missing or unknown */}
          {binaryPmids.length === 0 && nonBinaryPmids.length === 0 && (
            <div>
              {Array.from(new Set(litEntries.map((l) => l.pmid).filter(Boolean))).map((pmid) => (
                <div key={pmid} style={{ fontSize: 12 }}>
                  <a
                    href={`https://www.ncbi.nlm.nih.gov/pubmed/${pmid}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    PMID {pmid}
                  </a>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!hasExperiments && !hasLiterature && !hasDatasets && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
          No experimental data available.
        </div>
      )}
    </div>
  )
}
