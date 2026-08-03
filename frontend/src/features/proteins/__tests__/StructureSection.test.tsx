import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { StructureSection } from '../StructureSection'
import { server } from '../../../mocks/server'
import { confidenceSummary, plddtDistribution } from '../../search/network/alphafold'
import type { AlphaFoldEntry } from '../../search/network/alphafold'

function renderSection(uniprotId = 'Q92934') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <StructureSection uniprotId={uniprotId} geneName="BAD" />
    </QueryClientProvider>
  )
}

describe('StructureSection', () => {
  it('reports the mean pLDDT and a plain-language reading of it', async () => {
    renderSection()

    expect(await screen.findByText('75.1')).toBeInTheDocument()
    expect(screen.getByText('mean pLDDT')).toBeInTheDocument()
    expect(screen.getByText('Confident overall')).toBeInTheDocument()
  })

  it('breaks the model down into the four AlphaFold confidence bands', async () => {
    renderSection()

    expect(await screen.findByText('Very high')).toBeInTheDocument()
    expect(screen.getByText('Confident')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('Very low')).toBeInTheDocument()
    expect(screen.getByText('52.7%')).toBeInTheDocument()
  })

  it('shows the model provenance', async () => {
    renderSection()

    expect(await screen.findByText('AF-Q92934-F1')).toBeInTheDocument()
    expect(screen.getByText('v6')).toBeInTheDocument()
    expect(screen.getByText('Homo sapiens')).toBeInTheDocument()
    expect(screen.getByText('1–168')).toBeInTheDocument()
  })

  it('offers the model in both PDB and mmCIF form', async () => {
    renderSection()

    const pdb = await screen.findByRole('link', { name: 'PDB' })
    expect(pdb).toHaveAttribute(
      'href',
      'https://alphafold.ebi.ac.uk/files/AF-Q92934-F1-model_v6.pdb'
    )
    expect(screen.getByRole('link', { name: 'mmCIF' })).toHaveAttribute(
      'href',
      'https://alphafold.ebi.ac.uk/files/AF-Q92934-F1-model_v6.cif'
    )
  })

  it('switches between the 3D model and the PAE plot', async () => {
    const user = userEvent.setup()
    renderSection()

    await user.click(await screen.findByRole('button', { name: /PAE plot/i }))

    const plot = screen.getByRole('img', { name: /predicted aligned error/i })
    expect(plot).toHaveAttribute(
      'src',
      'https://alphafold.ebi.ac.uk/files/AF-Q92934-F1-predicted_aligned_error_v6.png'
    )
    expect(screen.getByText(/Darker shading means AlphaFold is more confident/)).toBeInTheDocument()
  })

  it('disables the PDB tab when no experimental structure exists', async () => {
    renderSection('P00000') // rcsb fixture returns no hits for anything but Q92934

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^PDB$/ })).toBeDisabled()
    )
  })

  it('describes the experimental entry when the PDB tab is chosen', async () => {
    const user = userEvent.setup()
    renderSection()

    const pdbTab = await screen.findByRole('button', { name: /PDB \(2BID\)/ })
    await waitFor(() => expect(pdbTab).toBeEnabled())
    await user.click(pdbTab)

    expect(screen.getByText('Experimental structure')).toBeInTheDocument()
    expect(screen.getByText(/deposited in the PDB as 2BID/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /RCSB PDB/ })).toHaveAttribute(
      'href',
      'https://www.rcsb.org/structure/2BID'
    )
  })

  it('says so when AlphaFold has no model for the accession', async () => {
    server.use(
      http.get('https://alphafold.ebi.ac.uk/api/prediction/:uniprotId', () =>
        HttpResponse.json([], { status: 404 })
      )
    )
    renderSection('P99999')

    expect(
      await screen.findByText('No AlphaFold model is available for this accession.')
    ).toBeInTheDocument()
  })

  it('explains that a 3D structure needs a UniProt accession', () => {
    renderSection('')
    expect(
      screen.getByText('No UniProt accession — a 3D structure cannot be resolved.')
    ).toBeInTheDocument()
  })
})

describe('plddtDistribution', () => {
  const entry = {
    fractionPlddtVeryHigh: 0.5,
    fractionPlddtConfident: 0.3,
    fractionPlddtLow: 0.2,
    fractionPlddtVeryLow: 0,
  } as AlphaFoldEntry

  it('orders bands from most to least confident and drops empty ones', () => {
    const bands = plddtDistribution(entry)
    expect(bands.map((b) => b.key)).toEqual(['veryHigh', 'confident', 'low'])
  })

  it('uses the colours the Mol* confidence theme paints with', () => {
    const bands = plddtDistribution(entry)
    expect(bands[0].color).toBe('#0053d6')
    expect(bands[1].color).toBe('#65cbf3')
    expect(bands[2].color).toBe('#ffdb13')
  })
})

describe('confidenceSummary', () => {
  it.each([
    [95, 'Very high confidence overall'],
    [75, 'Confident overall'],
    [60, 'Low confidence — interpret with care'],
    [30, 'Very low confidence — likely disordered'],
    [null, 'Confidence not reported'],
  ])('reads %s as %s', (score, expected) => {
    expect(confidenceSummary(score as number | null)).toBe(expected)
  })
})
