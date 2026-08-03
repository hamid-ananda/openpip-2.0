import { useEffect, useRef, useState } from 'react'
import { baseAccession } from './uniprot'

export interface StructureViewerProps {
  uniprotId: string
  source: 'alphafold' | 'pdb'
  pdbId: string | null
  height?: number
  /**
   * AlphaFold mmCIF URL, when the caller already holds the prediction entry.
   * Saves this component repeating the metadata lookup; omitted callers fall
   * back to fetching it themselves.
   */
  cifUrl?: string | null
  /** Show spin / reset / snapshot controls over the canvas. */
  showControls?: boolean
}

type Status = 'loading' | 'ready' | 'error-import' | 'error-structure'

async function fetchAlphaFoldCifUrl(uniprotId: string): Promise<string | null> {
  const res = await fetch(
    `https://alphafold.ebi.ac.uk/api/prediction/${baseAccession(uniprotId)}`
  )
  if (!res.ok) return null
  const data = await res.json()
  return (data as Array<{ cifUrl?: string }>)?.[0]?.cifUrl ?? null
}

function pdbCifUrl(pdbId: string) {
  return `https://files.rcsb.org/download/${pdbId.toUpperCase()}.cif`
}

function externalHref(source: 'alphafold' | 'pdb', uniprotId: string, pdbId: string | null) {
  if (source === 'alphafold') return `https://alphafold.ebi.ac.uk/entry/${baseAccession(uniprotId)}`
  return pdbId ? `https://www.rcsb.org/structure/${pdbId}` : null
}

export function StructureViewer({
  uniprotId,
  source,
  pdbId,
  height = 180,
  cifUrl,
  showControls = false,
}: StructureViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pluginRef = useRef<any>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [spinning, setSpinning] = useState(false)

  // Initialise Mol* once on mount; dynamic import keeps it out of initial bundle
  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    async function init() {
      try {
        const [
          { createPluginUI },
          { renderReact18 },
          { DefaultPluginUISpec },
          { PluginSpec },
          { MAQualityAssessment },
        ] = await Promise.all([
          import('molstar/lib/mol-plugin-ui'),
          import('molstar/lib/mol-plugin-ui/react18'),
          import('molstar/lib/mol-plugin-ui/spec'),
          import('molstar/lib/mol-plugin/spec'),
          import('molstar/lib/extensions/model-archive/quality-assessment/behavior'),
        ])
        await import('molstar/lib/mol-plugin-ui/skin/light.css')

        if (cancelled || !containerRef.current) return

        const defaultSpec = DefaultPluginUISpec()
        const plugin = await createPluginUI({
          target: containerRef.current,
          render: renderReact18,
          spec: {
            ...defaultSpec,
            // Not registered by default. It reads the per-residue pLDDT scores
            // out of the AlphaFold mmCIF, which the confidence colour theme
            // below then needs.
            behaviors: [
              ...defaultSpec.behaviors,
              PluginSpec.Behavior(MAQualityAssessment),
            ],
            layout: {
              initial: {
                isExpanded: false,
                showControls: false,
                regionState: {
                  bottom: 'hidden',
                  left: 'hidden',
                  right: 'hidden',
                  top: 'hidden',
                },
              },
            },
          },
        })

        if (cancelled) {
          plugin.dispose()
          return
        }
        pluginRef.current = plugin
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error-import')
      }
    }

    init()
    return () => {
      cancelled = true
      pluginRef.current?.dispose()
      pluginRef.current = null
    }
  }, [])

  // Reset error-structure back to ready when source/id changes so load can retry
  useEffect(() => {
    if (status === 'error-structure' && pluginRef.current) {
      setStatus('ready')
    }
  }, [source, uniprotId, pdbId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load / swap structure whenever plugin is ready or source/ids change
  useEffect(() => {
    if (status !== 'ready' || !pluginRef.current) return
    let cancelled = false
    const plugin = pluginRef.current

    async function load() {
      try {
        const url =
          source === 'alphafold'
            ? (cifUrl ?? (await fetchAlphaFoldCifUrl(uniprotId)))
            : pdbId
              ? pdbCifUrl(pdbId)
              : null
        if (!url) { if (!cancelled) setStatus('error-structure'); return }

        if (cancelled) return
        await plugin.clear()
        const data = await plugin.builders.data.download(
          { url },
          { state: { isGhost: true } }
        )
        if (cancelled) return
        const trajectory = await plugin.builders.structure.parseTrajectory(data, 'mmcif')
        if (cancelled) return

        // Colour AlphaFold models by per-residue confidence, the convention
        // every AlphaFold consumer expects. Experimental PDB entries carry no
        // pLDDT, so they keep the default chain colouring.
        let preset: unknown = 'default'
        if (source === 'alphafold') {
          try {
            const { QualityAssessmentPLDDTPreset } = await import(
              'molstar/lib/extensions/model-archive/quality-assessment/behavior'
            )
            preset = QualityAssessmentPLDDTPreset
          } catch {
            // Fall through to the default preset — an uncoloured model still
            // beats no model.
          }
        }
        if (cancelled) return
        try {
          await plugin.builders.structure.hierarchy.applyPreset(trajectory, preset)
        } catch {
          if (preset === 'default') throw new Error('preset failed')
          await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default')
        }
      } catch {
        if (!cancelled) setStatus('error-structure')
      }
    }

    load()
    return () => { cancelled = true }
  }, [status, source, uniprotId, pdbId, cifUrl])

  // Loading a different structure stops the spin (render-phase reset, so the
  // button never renders one frame out of step with the canvas).
  const structureKey = `${source}:${uniprotId}:${pdbId}`
  const [prevStructureKey, setPrevStructureKey] = useState(structureKey)
  if (structureKey !== prevStructureKey) {
    setPrevStructureKey(structureKey)
    setSpinning(false)
  }

  const toggleSpin = () => {
    const plugin = pluginRef.current
    if (!plugin) return
    const next = !spinning
    setSpinning(next)
    plugin.canvas3d?.setProps({ trackball: { animate: next ? { name: 'spin', params: { speed: 1 } } : { name: 'off', params: {} } } })
  }

  const resetView = () => pluginRef.current?.canvas3d?.requestCameraReset()

  const downloadSnapshot = () => {
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `${source === 'alphafold' ? uniprotId : pdbId}_structure.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const href = externalHref(source, uniprotId, pdbId)
  const linkLabel = source === 'alphafold' ? '↗ View on AlphaFold' : '↗ View on RCSB PDB'

  return (
    <div>
      {/* Wrapper provides the stacking context for absolutely-positioned overlays */}
      <div style={{ position: 'relative', height, borderRadius: 4, overflow: 'hidden' }}>
        {/* Mol* calls createRoot() on this div — React must put NO children here */}
        <div ref={containerRef} style={{ height: '100%', background: '#0d0d1e' }} />

        {showControls && status === 'ready' && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 2,
              display: 'flex',
              gap: 4,
            }}
          >
            <button type="button" onClick={toggleSpin} style={viewerBtn(spinning)} title="Spin the model">
              ⟳
            </button>
            <button type="button" onClick={resetView} style={viewerBtn(false)} title="Reset the camera">
              ⛶
            </button>
            <button
              type="button"
              onClick={downloadSnapshot}
              style={viewerBtn(false)}
              title="Save a PNG of the current view"
            >
              ⤓
            </button>
          </div>
        )}

        {/* Status overlays are siblings, not children, of the Mol* container */}
        {status === 'loading' && (
          <div style={overlay}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading structure…</span>
          </div>
        )}
        {status === 'error-import' && (
          <div style={overlay}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Could not load viewer</span>
            {href && (
              <a href={href} target="_blank" rel="noreferrer" style={extLinkStyle}>
                {linkLabel}
              </a>
            )}
          </div>
        )}
        {status === 'error-structure' && (
          <div style={overlay}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Structure not available</span>
            {href && (
              <a href={href} target="_blank" rel="noreferrer" style={extLinkStyle}>
                {linkLabel}
              </a>
            )}
          </div>
        )}
      </div>
      {status === 'ready' && href && (
        <div style={{ marginTop: 4 }}>
          <a href={href} target="_blank" rel="noreferrer" style={extLinkStyle}>
            {linkLabel}
          </a>
        </div>
      )}
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  background: '#0d0d1e',
  zIndex: 1,
}

const extLinkStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--accent)',
  textDecoration: 'none',
}

/** Overlay button sitting on the dark canvas, so it carries its own palette. */
function viewerBtn(active: boolean): React.CSSProperties {
  return {
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    border: '1px solid rgba(255,255,255,.22)',
    background: active ? 'var(--accent)' : 'rgba(15,15,32,.72)',
    color: '#fff',
    fontSize: 13,
    lineHeight: 1,
    cursor: 'pointer',
    padding: 0,
  }
}
