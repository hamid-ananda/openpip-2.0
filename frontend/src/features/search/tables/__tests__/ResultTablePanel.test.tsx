import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ResultTablePanel } from '../ResultTablePanel'
import { useSearchStore } from '../../searchStore'
import { searchFixture } from '../../../../mocks/fixtures/search'

const enrichmentSpy = vi.fn()
vi.mock('../../../../api/enrichment', () => ({
  useEnrichment: (genes: string[]) => {
    enrichmentSpy(genes)
    return { data: [], isLoading: false, isError: false }
  },
}))

describe('ResultTablePanel enrichment prefetch', () => {
  beforeEach(() => {
    enrichmentSpy.mockClear()
    useSearchStore.getState().setSearchData(searchFixture)
  })

  it('runs enrichment in the background while the default (Interactions) tab is active', () => {
    render(<ResultTablePanel />)
    // Enrichment fires even though EnrichmentTable is not mounted yet, so the
    // enrichment tabs are cached by the time the user clicks one.
    expect(enrichmentSpy).toHaveBeenCalled()
    const calls = enrichmentSpy.mock.calls
    const genes = calls[calls.length - 1][0]
    expect(genes.length).toBeGreaterThan(0)
  })
})
