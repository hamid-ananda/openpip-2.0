import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// ------------------------------------------------------------------
// Mock all Mol* dynamic imports — WebGL does not exist in jsdom
// ------------------------------------------------------------------
const mockPlugin = {
  clear: vi.fn().mockResolvedValue(undefined),
  dispose: vi.fn(),
  builders: {
    data: { download: vi.fn().mockResolvedValue({}) },
    structure: {
      parseTrajectory: vi.fn().mockResolvedValue({}),
      hierarchy: { applyPreset: vi.fn().mockResolvedValue(undefined) },
    },
  },
}

vi.mock('molstar/lib/mol-plugin-ui', () => ({
  createPluginUI: vi.fn().mockResolvedValue(mockPlugin),
}))
vi.mock('molstar/lib/mol-plugin-ui/react18', () => ({
  renderReact18: vi.fn(),
}))
vi.mock('molstar/lib/mol-plugin-ui/spec', () => ({
  DefaultPluginUISpec: vi.fn().mockReturnValue({ layout: {} }),
}))
vi.mock('molstar/lib/mol-plugin-ui/skin/light.css', () => ({}))

// Import AFTER mocks are registered
import { StructureViewer } from '../StructureViewer'

describe('StructureViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPlugin.clear.mockResolvedValue(undefined)
    mockPlugin.dispose.mockReset()
    mockPlugin.builders.data.download.mockResolvedValue({})
    mockPlugin.builders.structure.parseTrajectory.mockResolvedValue({})
    mockPlugin.builders.structure.hierarchy.applyPreset.mockResolvedValue(undefined)
  })

  it('shows loading message initially', () => {
    render(<StructureViewer uniprotId="Q92934" source="alphafold" pdbId={null} />)
    expect(screen.getByText('Loading structure…')).toBeInTheDocument()
  })

  it('shows AlphaFold external link after init succeeds', async () => {
    render(<StructureViewer uniprotId="Q92934" source="alphafold" pdbId={null} />)
    await waitFor(() => expect(screen.getByText('↗ View on AlphaFold')).toBeInTheDocument())
  })

  it('downloads AlphaFold CIF with the correct URL', async () => {
    render(<StructureViewer uniprotId="Q92934" source="alphafold" pdbId={null} />)
    await waitFor(() =>
      expect(mockPlugin.builders.data.download).toHaveBeenCalledWith(
        { url: 'https://alphafold.ebi.ac.uk/files/AF-Q92934-F1-model_v4.cif' },
        expect.anything()
      )
    )
  })

  it('shows RCSB PDB external link when source is pdb', async () => {
    render(<StructureViewer uniprotId="Q92934" source="pdb" pdbId="2BID" />)
    await waitFor(() => expect(screen.getByText('↗ View on RCSB PDB')).toBeInTheDocument())
  })

  it('downloads PDB CIF with the correct URL', async () => {
    render(<StructureViewer uniprotId="Q92934" source="pdb" pdbId="2BID" />)
    await waitFor(() =>
      expect(mockPlugin.builders.data.download).toHaveBeenCalledWith(
        { url: 'https://files.rcsb.org/download/2BID.cif' },
        expect.anything()
      )
    )
  })

  it('shows "Could not load viewer" when Mol* import rejects', async () => {
    const { createPluginUI } = await import('molstar/lib/mol-plugin-ui')
    vi.mocked(createPluginUI).mockRejectedValueOnce(new Error('import failed'))
    render(<StructureViewer uniprotId="Q92934" source="alphafold" pdbId={null} />)
    await waitFor(() => expect(screen.getByText('Could not load viewer')).toBeInTheDocument())
  })

  it('shows "Structure not available" when structure download fails', async () => {
    mockPlugin.builders.data.download.mockRejectedValueOnce(new Error('404'))
    render(<StructureViewer uniprotId="Q92934" source="alphafold" pdbId={null} />)
    await waitFor(() => expect(screen.getByText('Structure not available')).toBeInTheDocument())
  })

  it('calls plugin.dispose() on unmount', async () => {
    const { unmount } = render(
      <StructureViewer uniprotId="Q92934" source="alphafold" pdbId={null} />
    )
    await waitFor(() => expect(screen.getByText('↗ View on AlphaFold')).toBeInTheDocument())
    unmount()
    expect(mockPlugin.dispose).toHaveBeenCalledTimes(1)
  })
})
