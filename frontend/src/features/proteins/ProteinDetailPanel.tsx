import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProteinDetail } from '../../api/proteins'
import { useProteinInteractors } from '../../api/proteins'
import { downloadFile } from '../../lib/download'
import { useText } from '../../text'
import { formatProteinJSON, formatProteinTSV, proteinFileStem } from './exportProtein'
import { computeSequenceStats, toFasta } from './sequenceStats'
import { StructureSection } from './StructureSection'

const STYLES = `
  .pdp-wrap { max-width: 1180px; margin: 0 auto; padding: 28px 32px 64px; }

  /* Two independent flow columns rather than one auto-flowing grid: sections
     have very different heights, and a shared grid would align their rows and
     tear holes between them. */
  .pdp-cols { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 0 44px; }
  @media (max-width: 900px) { .pdp-cols { grid-template-columns: minmax(0, 1fr); gap: 0; } }

  .pdp-stats { display: flex; flex-wrap: wrap; align-items: stretch; gap: 0; }
  .pdp-stat { padding: 0 20px; border-left: 1px solid var(--border); }
  .pdp-stat:first-child { padding-left: 0; border-left: none; }

  .pdp-tissue { display: grid; grid-template-columns: minmax(0, 1fr) 46px; gap: 3px 10px; }

  .pdp-link { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px;
              color: var(--accent); text-decoration: none; }
  .pdp-link:hover { text-decoration: underline; }

  .pdp-chip { font-size: 12px; background: var(--primary-soft); color: var(--primary-deep);
              border-radius: 999px; padding: 3px 11px; text-transform: capitalize; }
`

/** Section heading: a real heading with a hairline, not another micro-caps label. */
function Heading({ children, first = false }: { children: React.ReactNode; first?: boolean }) {
  return (
    <h2
      style={{
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '-.01em',
        color: 'var(--text)',
        margin: first ? '0 0 12px' : '34px 0 12px',
        paddingBottom: 7,
        borderBottom: '1px solid var(--border)',
      }}
    >
      {children}
    </h2>
  )
}

const EXTERNAL_LINKS = (protein: ProteinDetail) =>
  [
    protein.protein_entrez_id && {
      label: 'NCBI Gene',
      href: `https://www.ncbi.nlm.nih.gov/gene/${protein.protein_entrez_id}`,
      fav: 'https://www.ncbi.nlm.nih.gov/favicon.ico',
    },
    protein.protein_uniprot_id && {
      label: 'UniProt',
      href: `https://www.uniprot.org/uniprot/${protein.protein_uniprot_id}`,
      fav: 'https://www.uniprot.org/favicon.ico',
    },
    protein.protein_uniprot_id && {
      label: 'Human Protein Atlas',
      href: `https://www.proteinatlas.org/${protein.protein_uniprot_id}`,
      fav: 'https://www.proteinatlas.org/favicon.ico',
    },
    protein.protein_ensembl_id && {
      label: 'Ensembl',
      href: `https://www.ensembl.org/id/${protein.protein_ensembl_id}`,
      fav: 'https://www.ensembl.org/favicon.ico',
    },
    protein.protein_gene_name && {
      label: 'GeneCards',
      href: `https://www.genecards.org/cgi-bin/carddisp.pl?gene=${protein.protein_gene_name}`,
      fav: 'https://www.genecards.org/favicon.ico',
    },
    protein.protein_gene_name && {
      label: 'STRING',
      href: `https://string-db.org/network/${protein.protein_gene_name}`,
      fav: 'https://string-db.org/favicon.ico',
    },
  ].filter(Boolean) as { label: string; href: string; fav: string }[]

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="pdp-stat">
      <div
        style={{
          fontSize: 21,
          fontWeight: 600,
          letterSpacing: '-.02em',
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.15,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
    </div>
  )
}

export interface ProteinDetailPanelProps {
  protein: ProteinDetail
  /** Follows a link from the interactors list to another protein. */
  onSelectInteractor: (identifier: string) => void
}

export function ProteinDetailPanel({ protein, onSelectInteractor }: ProteinDetailPanelProps) {
  const t = useText()
  const [copied, setCopied] = useState(false)
  const [showComposition, setShowComposition] = useState(false)
  const [prevProteinId, setPrevProteinId] = useState(protein.protein_id)

  const gene = protein.protein_gene_name || protein.protein_uniprot_id || '—'
  const uniprotId = protein.protein_uniprot_id
  const identifier = protein.protein_gene_name || protein.protein_uniprot_id

  // Switching protein resets the panel's own view state (render-phase pattern).
  if (protein.protein_id !== prevProteinId) {
    setPrevProteinId(protein.protein_id)
    setShowComposition(false)
    setCopied(false)
  }

  const { data: interactors, isLoading: interactorsLoading } = useProteinInteractors(identifier)

  const stats = computeSequenceStats(protein.protein_sequence)
  const fasta = toFasta(protein.protein_sequence, protein.protein_gene_name, uniprotId)

  const copyFasta = () => {
    navigator.clipboard.writeText(fasta).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      },
      () => {}
    )
  }

  const tissues = Object.entries(protein.tissue_expression_array || {})
    .map(([tissue, value]) => ({
      tissue: tissue.replace(/_/g, ' '),
      score: parseFloat(String(value)),
    }))
    .filter((entry) => !isNaN(entry.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
  const maxTissueScore = tissues[0]?.score ?? 1

  const subcellular = Object.entries(protein.subcellular_location_expression_array || {})
    .filter(([, status]) => status && String(status).length > 0)
    .map(([location, status]) => ({
      location: location.replace(/_/g, ' '),
      status: String(status),
    }))

  // The JSON-blob annotations are rendered as their own sections above.
  const annotations = Object.entries(protein.annotation_array || {}).filter(
    ([type, values]) =>
      type !== 'tissue_expression' &&
      type !== 'subcellular_location' &&
      values.length > 0 &&
      !String(values[0]).trim().startsWith('{')
  )

  const identifierRows = [
    { label: 'Gene', value: protein.protein_gene_name, href: undefined },
    {
      label: 'UniProt',
      value: uniprotId,
      href: uniprotId ? `https://www.uniprot.org/uniprot/${uniprotId}` : undefined,
    },
    {
      label: 'Ensembl',
      value: protein.protein_ensembl_id,
      href: protein.protein_ensembl_id
        ? `https://www.ensembl.org/id/${protein.protein_ensembl_id}`
        : undefined,
    },
    {
      label: 'Entrez',
      value: protein.protein_entrez_id,
      href: protein.protein_entrez_id
        ? `https://www.ncbi.nlm.nih.gov/gene/${protein.protein_entrez_id}`
        : undefined,
    },
  ].filter((row) => row.value)

  return (
    <>
      <style>{STYLES}</style>
      <div className="pdp-wrap">
        {/* ── Header ── */}
        <header
          style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: '14px 20px' }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: '-.03em',
                color: 'var(--text)',
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              {gene}
            </h1>
            {protein.protein_protein_name && (
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--text-muted)',
                  margin: '7px 0 0',
                  maxWidth: '62ch',
                  lineHeight: 1.45,
                }}
              >
                {protein.protein_protein_name}
              </p>
            )}
          </div>
          <Link
            to={`/search/${encodeURIComponent(identifier)}`}
            className="op-btn primary"
            style={{ fontSize: 13, padding: '8px 18px', flexShrink: 0 }}
          >
            {t('proteins.viewNetwork')}
          </Link>
        </header>

        {/* ── Key numbers ── */}
        <div className="pdp-stats" style={{ marginTop: 22 }}>
          <Stat
            value={protein.number_of_interactions_in_database.toLocaleString()}
            label={t('proteins.statInteractions')}
          />
          <Stat
            value={stats.length ? stats.length.toLocaleString() : '—'}
            label={t('proteins.statLength')}
          />
          <Stat
            value={stats.molecularWeight ? `${(stats.molecularWeight / 1000).toFixed(1)} kDa` : '—'}
            label={t('proteins.statWeight')}
          />
          <Stat
            value={stats.isoelectricPoint ? stats.isoelectricPoint.toFixed(2) : '—'}
            label={t('proteins.statPi')}
          />
        </div>

        {/* ── 3D structure leads the page ── */}
        <div style={{ marginTop: 26 }}>
          <StructureSection uniprotId={uniprotId} geneName={protein.protein_gene_name} />
        </div>

        <div className="pdp-cols" style={{ marginTop: 30 }}>
          {/* ── Main column: what this protein is and does ── */}
          <div>
            {protein.protein_description && (
              <>
                <Heading first>{t('proteins.sectionDescription')}</Heading>
                <p
                  style={{
                    fontSize: 13.5,
                    color: 'var(--text)',
                    lineHeight: 1.72,
                    margin: 0,
                    maxWidth: '70ch',
                  }}
                >
                  {protein.protein_description}
                </p>
              </>
            )}

            <Heading first={!protein.protein_description}>
              {t('proteins.sectionInteractors')}
            </Heading>
            {interactorsLoading ? (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {t('proteins.interactorsLoading')}
              </div>
            ) : interactors && interactors.results.length > 0 ? (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {interactors.results.map((interactor) => {
                    const label =
                      interactor.protein_gene_name || interactor.protein_uniprot_id || '—'
                    return (
                      <button
                        key={interactor.protein_id}
                        type="button"
                        className="op-btn"
                        onClick={() => onSelectInteractor(label)}
                        title={
                          interactor.protein_protein_name ||
                          t('proteins.interactorTitle', { gene: label })
                        }
                        style={{
                          fontSize: 12,
                          padding: '5px 12px',
                          fontFamily: 'var(--mono)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                        }}
                      >
                        {label}
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--text-soft)',
                            fontFamily: 'var(--font)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          ×{interactor.shared_interaction_count}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-soft)', marginTop: 10 }}>
                  {t('proteins.interactorsFooter', {
                    shown: interactors.results.length,
                    total: interactors.count.toLocaleString(),
                  })}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {t('proteins.noInteractors')}
              </div>
            )}

            {annotations.length > 0 && (
              <>
                <Heading>{t('proteins.sectionAnnotations')}</Heading>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {annotations.map(([type, values]) => (
                    <div key={type}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          textTransform: 'capitalize',
                          marginBottom: 5,
                        }}
                      >
                        {type.replace(/_/g, ' ')}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {values.slice(0, 24).map((value, index) => (
                          <span key={index} className="op-chip" style={{ fontSize: 11 }}>
                            {value.length > 120 ? `${value.slice(0, 120)}…` : value}
                          </span>
                        ))}
                        {values.length > 24 && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            +{values.length - 24} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {protein.protein_sequence && (
              <>
                <Heading>
                  {t('proteins.sectionSequence')}
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 400,
                      color: 'var(--text-soft)',
                      marginLeft: 8,
                      letterSpacing: 0,
                    }}
                  >
                    {stats.length} aa
                  </span>
                </Heading>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  <button
                    type="button"
                    className="op-btn"
                    style={{ fontSize: 11, padding: '4px 10px' }}
                    onClick={copyFasta}
                  >
                    {copied ? t('proteins.copied') : t('proteins.copyFasta')}
                  </button>
                  <button
                    type="button"
                    className="op-btn"
                    style={{ fontSize: 11, padding: '4px 10px' }}
                    onClick={() => downloadFile(`${proteinFileStem(protein)}.fasta`, fasta)}
                  >
                    {t('proteins.downloadFasta')}
                  </button>
                  <button
                    type="button"
                    className="op-btn"
                    style={{ fontSize: 11, padding: '4px 10px' }}
                    onClick={() => setShowComposition((shown) => !shown)}
                  >
                    {showComposition
                      ? t('proteins.hideComposition')
                      : t('proteins.showComposition')}
                  </button>
                  <a
                    className="op-btn"
                    style={{ fontSize: 11, padding: '4px 10px' }}
                    href={`https://blast.ncbi.nlm.nih.gov/Blast.cgi?PAGE=Proteins&PROGRAM=blastp&QUERY=${encodeURIComponent(
                      protein.protein_sequence
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('proteins.blast')}
                  </a>
                </div>

                {showComposition && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))',
                      gap: 4,
                      marginBottom: 12,
                    }}
                  >
                    {stats.composition.map(({ residue, count, fraction }) => (
                      <div
                        key={residue}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 5,
                          padding: '4px 8px',
                          fontSize: 11,
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 6,
                        }}
                      >
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>
                          {residue}
                        </span>
                        <span
                          style={{
                            color: 'var(--text-muted)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {count} · {(fraction * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11.5,
                    lineHeight: 2,
                    wordBreak: 'break-all',
                    color: 'var(--text-muted)',
                    background: 'var(--surface-2)',
                    borderRadius: 6,
                    padding: '12px 14px',
                    maxHeight: 172,
                    overflowY: 'auto',
                  }}
                >
                  {protein.protein_sequence.match(/.{1,10}/g)?.join(' ')}
                </div>
              </>
            )}
          </div>

          {/* ── Aside: reference data ── */}
          <div>
            <Heading first>{t('proteins.sectionIdentifiers')}</Heading>
            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto minmax(0, 1fr)',
                gap: '7px 14px',
                margin: 0,
                fontSize: 12.5,
              }}
            >
              {identifierRows.map(({ label, value, href }) => (
                <div key={label} style={{ display: 'contents' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>{label}</dt>
                  <dd
                    style={{
                      margin: 0,
                      fontFamily: 'var(--mono)',
                      overflowWrap: 'anywhere',
                      color: 'var(--text)',
                    }}
                  >
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--accent)', textDecoration: 'none' }}
                      >
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {tissues.length > 0 && (
              <>
                <Heading>{t('proteins.sectionTissue')}</Heading>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {tissues.map(({ tissue, score }) => (
                    <div key={tissue}>
                      <div className="pdp-tissue">
                        <span
                          style={{
                            fontSize: 12,
                            color: 'var(--text)',
                            textTransform: 'capitalize',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tissue}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            textAlign: 'right',
                            fontFamily: 'var(--mono)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {score.toFixed(1)}
                        </span>
                      </div>
                      {/* --border reads against the page in both themes, and the
                          fill uses --primary-deep: the only brand shade derived
                          per theme, so it stays visible whatever the admin picks.
                          --primary alone was the bug here, landing at 1.02:1 on
                          the shipped near-black brand. */}
                      <div
                        style={{
                          height: 6,
                          background: 'var(--border)',
                          borderRadius: 3,
                          overflow: 'hidden',
                          marginTop: 4,
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.max(2, (score / maxTissueScore) * 100)}%`,
                            background: 'var(--primary-deep)',
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {subcellular.length > 0 && (
              <>
                <Heading>{t('proteins.sectionSubcellular')}</Heading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {subcellular.map(({ location, status }) => (
                    <span key={location} className="pdp-chip">
                      {location}
                      {status !== 'validated' && (
                        <span style={{ fontSize: 10, opacity: 0.75 }}> ({status})</span>
                      )}
                    </span>
                  ))}
                </div>
              </>
            )}

            <Heading>{t('proteins.sectionExternal')}</Heading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EXTERNAL_LINKS(protein).map(({ label, href, fav }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="pdp-link"
                >
                  <img
                    src={fav}
                    width={14}
                    height={14}
                    alt=""
                    style={{ borderRadius: 2, flexShrink: 0 }}
                  />
                  {label}
                </a>
              ))}
            </div>

            <Heading>{t('proteins.sectionExport')}</Heading>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button
                type="button"
                className="op-btn"
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={() =>
                  downloadFile(`${proteinFileStem(protein)}.json`, formatProteinJSON(protein))
                }
              >
                {t('proteins.exportJson')}
              </button>
              <button
                type="button"
                className="op-btn"
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={() =>
                  downloadFile(`${proteinFileStem(protein)}.tsv`, formatProteinTSV(protein))
                }
              >
                {t('proteins.exportTsv')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
