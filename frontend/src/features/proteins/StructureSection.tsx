import { useState } from 'react'
import {
  confidenceSummary,
  plddtDistribution,
  useAlphaFoldEntry,
} from '../search/network/alphafold'
import { StructureViewer } from '../search/network/StructureViewer'
import { useStructureAvailability } from '../search/network/useStructureAvailability'
import { baseAccession } from '../search/network/uniprot'
import { useText } from '../../text'

const STYLES = `
  .ss-body { display: flex; flex-wrap: wrap; gap: 18px; align-items: stretch; }
  .ss-viewer { flex: 2 1 420px; min-width: 300px; display: flex; flex-direction: column; }
  .ss-meta { flex: 1 1 260px; min-width: 240px; display: flex; flex-direction: column; gap: 14px; }
`

const META_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

function tabStyle(active: boolean, disabled = false): React.CSSProperties {
  return {
    flex: 1,
    padding: '7px 0',
    border: 'none',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
    fontSize: 12,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  }
}

export interface StructureSectionProps {
  uniprotId: string
  /** Gene name, used for download filenames. */
  geneName: string
}

export function StructureSection({ uniprotId, geneName }: StructureSectionProps) {
  const t = useText()
  const [source, setSource] = useState<'alphafold' | 'pdb'>('alphafold')
  const [view, setView] = useState<'3d' | 'pae'>('3d')

  const { pdbId, loading: pdbLoading, error: pdbError } = useStructureAvailability(uniprotId)
  const { data: entry, isLoading: entryLoading } = useAlphaFoldEntry(uniprotId)

  if (!uniprotId) {
    return (
      <div className="op-card" style={{ padding: '20px 24px' }}>
        <div style={META_LABEL}>{t('proteins.sectionStructure')}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>
          {t('proteins.structureNoUniprot')}
        </div>
      </div>
    )
  }

  const pdbDisabled = pdbLoading || pdbId === null
  const pdbTitle = pdbError
    ? 'Could not check PDB availability'
    : pdbLoading
      ? 'Checking PDB availability…'
      : 'No experimental structure in the PDB for this protein'

  const bands = entry ? plddtDistribution(entry) : []
  const meanPlddt = entry?.globalMetricValue ?? null
  const showPae = source === 'alphafold' && !!entry?.paeImageUrl

  // The PAE plot only exists for predicted models.
  const effectiveView = showPae ? view : '3d'

  return (
    <>
      <style>{STYLES}</style>
      <div className="op-card" style={{ padding: '18px 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div style={META_LABEL}>{t('proteins.sectionStructure')}</div>

          {/* Source switch */}
          <div
            style={{
              display: 'flex',
              borderRadius: 6,
              overflow: 'hidden',
              border: '1px solid var(--border)',
              marginLeft: 'auto',
              minWidth: 190,
            }}
          >
            <button
              type="button"
              onClick={() => setSource('alphafold')}
              style={{ ...tabStyle(source === 'alphafold'), borderRight: '1px solid var(--border)' }}
            >
              AlphaFold
            </button>
            <button
              type="button"
              onClick={() => {
                if (!pdbDisabled) setSource('pdb')
              }}
              disabled={pdbDisabled}
              title={pdbDisabled ? pdbTitle : undefined}
              style={tabStyle(source === 'pdb', pdbDisabled)}
            >
              PDB{pdbId ? ` (${pdbId})` : ''}
            </button>
          </div>

          {/* 3D / PAE switch — predicted models only */}
          {showPae && (
            <div
              style={{
                display: 'flex',
                borderRadius: 6,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                minWidth: 150,
              }}
            >
              <button
                type="button"
                onClick={() => setView('3d')}
                style={{ ...tabStyle(effectiveView === '3d'), borderRight: '1px solid var(--border)' }}
              >
                {t('proteins.view3d')}
              </button>
              <button
                type="button"
                onClick={() => setView('pae')}
                title={t('proteins.paeTitle')}
                style={tabStyle(effectiveView === 'pae')}
              >
                {t('proteins.viewPae')}
              </button>
            </div>
          )}
        </div>

        <div className="ss-body">
          <div className="ss-viewer">
            {effectiveView === '3d' ? (
              <StructureViewer
                uniprotId={uniprotId}
                source={source}
                pdbId={pdbId}
                cifUrl={source === 'alphafold' ? entry?.cifUrl : undefined}
                height={400}
                showControls
              />
            ) : (
              <div>
                <img
                  src={entry?.paeImageUrl ?? ''}
                  alt={t('proteins.paeAlt')}
                  style={{
                    width: '100%',
                    height: 400,
                    objectFit: 'contain',
                    background: '#fff',
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                  }}
                />
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    margin: '8px 0 0',
                  }}
                >
                  {t('proteins.paeExplainer')}
                </p>
              </div>
            )}
          </div>

          <div className="ss-meta">
            {source === 'alphafold' ? (
              entryLoading ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {t('proteins.modelLoading')}
                </div>
              ) : entry ? (
                <>
                  {/* Confidence */}
                  <div>
                    <div style={META_LABEL}>{t('proteins.modelConfidence')}</div>
                    {meanPlddt !== null && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                        <span
                          style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary-deep)' }}
                        >
                          {meanPlddt.toFixed(1)}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {t('proteins.meanPlddt')}
                        </span>
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 2 }}>
                      {confidenceSummary(meanPlddt)}
                    </div>

                    {bands.length > 0 && (
                      <>
                        {/* Stacked bar: share of residues in each band */}
                        <div
                          style={{
                            display: 'flex',
                            height: 10,
                            borderRadius: 5,
                            overflow: 'hidden',
                            marginTop: 10,
                            border: '1px solid var(--border)',
                          }}
                        >
                          {bands.map((band) => (
                            <div
                              key={band.key}
                              title={`${band.label}: ${(band.fraction * 100).toFixed(1)}%`}
                              style={{
                                width: `${band.fraction * 100}%`,
                                background: band.color,
                              }}
                            />
                          ))}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                            marginTop: 8,
                          }}
                        >
                          {bands.map((band) => (
                            <div
                              key={band.key}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
                            >
                              <span
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 2,
                                  background: band.color,
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ color: 'var(--text)' }}>{band.label}</span>
                              <span style={{ color: 'var(--text-soft)', fontSize: 10 }}>
                                {band.range}
                              </span>
                              <span
                                style={{
                                  marginLeft: 'auto',
                                  color: 'var(--text-muted)',
                                  fontFamily: 'var(--mono)',
                                }}
                              >
                                {(band.fraction * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-soft)', marginTop: 6 }}>
                          {t('proteins.plddtNote')}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Model provenance */}
                  <div>
                    <div style={META_LABEL}>{t('proteins.modelDetails')}</div>
                    <dl
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        gap: '3px 10px',
                        fontSize: 11,
                        margin: '6px 0 0',
                      }}
                    >
                      {[
                        [t('proteins.modelId'), entry.entryId],
                        [t('proteins.modelVersion'), `v${entry.latestVersion}`],
                        [
                          t('proteins.modelDate'),
                          entry.modelCreatedDate
                            ? new Date(entry.modelCreatedDate).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—',
                        ],
                        [t('proteins.modelResidues'), `${entry.sequenceStart}–${entry.sequenceEnd}`],
                        [t('proteins.modelOrganism'), entry.organismScientificName ?? '—'],
                        [t('proteins.modelTool'), entry.toolUsed ?? '—'],
                      ].map(([label, value]) => (
                        <div key={String(label)} style={{ display: 'contents' }}>
                          <dt style={{ color: 'var(--text-muted)' }}>{label}</dt>
                          <dd
                            style={{
                              margin: 0,
                              color: 'var(--text)',
                              fontFamily: 'var(--mono)',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* Downloads */}
                  <div>
                    <div style={META_LABEL}>{t('proteins.modelDownloads')}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                      <a
                        className="op-btn"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        href={entry.pdbUrl}
                        download={`${geneName || uniprotId}_alphafold.pdb`}
                      >
                        PDB
                      </a>
                      <a
                        className="op-btn"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        href={entry.cifUrl}
                        download={`${geneName || uniprotId}_alphafold.cif`}
                      >
                        mmCIF
                      </a>
                      {entry.paeDocUrl && (
                        <a
                          className="op-btn"
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          href={entry.paeDocUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t('proteins.paeData')}
                        </a>
                      )}
                      <a
                        className="op-btn"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        href={`https://alphafold.ebi.ac.uk/entry/${baseAccession(uniprotId)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('proteins.openAlphafold')}
                      </a>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {t('proteins.noAlphafoldModel')}
                </div>
              )
            ) : (
              /* PDB source */
              <div>
                <div style={META_LABEL}>{t('proteins.experimentalStructure')}</div>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    margin: '6px 0 10px',
                  }}
                >
                  {pdbId
                    ? t('proteins.pdbExplainer', { pdbId })
                    : t('proteins.structureNonePdb')}
                </p>
                {pdbId && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    <a
                      className="op-btn"
                      style={{ fontSize: 11, padding: '4px 10px' }}
                      href={`https://files.rcsb.org/download/${pdbId.toUpperCase()}.cif`}
                      download
                    >
                      mmCIF
                    </a>
                    <a
                      className="op-btn"
                      style={{ fontSize: 11, padding: '4px 10px' }}
                      href={`https://www.rcsb.org/structure/${pdbId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('proteins.openRcsb')}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
