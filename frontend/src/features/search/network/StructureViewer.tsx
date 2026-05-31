import { useEffect, useRef, useState } from 'react'

export interface StructureViewerProps {
  uniprotId: string
  source: 'alphafold' | 'pdb'
  pdbId: string | null
}

type Status = 'loading' | 'ready' | 'error-import' | 'error-structure'

async function fetchAlphaFoldCifUrl(uniprotId: string): Promise<string | null> {
  const res = await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`)
  if (!res.ok) return null
  const data = await res.json()
  return (data as Array<{ cifUrl?: string }>)?.[0]?.cifUrl ?? null
}

function pdbCifUrl(pdbId: string) {
  return `https://files.rcsb.org/download/${pdbId.toUpperCase()}.cif`
}

function externalHref(source: 'alphafold' | 'pdb', uniprotId: string, pdbId: string | null) {
  if (source === 'alphafold') return `https://alphafold.ebi.ac.uk/entry/${uniprotId}`
  return pdbId ? `https://www.rcsb.org/structure/${pdbId}` : null
}

export function StructureViewer({ uniprotId, source, pdbId }: StructureViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pluginRef = useRef<any>(null)
  const [status, setStatus] = useState<Status>('loading')

  // Initialise Mol* once on mount; dynamic import keeps it out of initial bundle
  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    async function init() {
      try {
        const [{ createPluginUI }, { renderReact18 }, { DefaultPluginUISpec }] =
          await Promise.all([
            import('molstar/lib/mol-plugin-ui'),
            import('molstar/lib/mol-plugin-ui/react18'),
            import('molstar/lib/mol-plugin-ui/spec'),
          ])
        await import('molstar/lib/mol-plugin-ui/skin/light.css')

        if (cancelled || !containerRef.current) return

        const plugin = await createPluginUI({
          target: containerRef.current,
          render: renderReact18,
          spec: {
            ...DefaultPluginUISpec(),
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
            ? await fetchAlphaFoldCifUrl(uniprotId)
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
        await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default')
      } catch {
        if (!cancelled) setStatus('error-structure')
      }
    }

    load()
    return () => { cancelled = true }
  }, [status, source, uniprotId, pdbId])

  const href = externalHref(source, uniprotId, pdbId)
  const linkLabel = source === 'alphafold' ? '↗ View on AlphaFold' : '↗ View on RCSB PDB'

  return (
    <div>
      {/* Wrapper provides the stacking context for absolutely-positioned overlays */}
      <div style={{ position: 'relative', height: 180, borderRadius: 4, overflow: 'hidden' }}>
        {/* Mol* calls createRoot() on this div — React must put NO children here */}
        <div ref={containerRef} style={{ height: '100%', background: '#0d0d1e' }} />

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
