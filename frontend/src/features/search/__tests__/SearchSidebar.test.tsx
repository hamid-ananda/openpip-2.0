import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { SearchSidebar } from '../SearchSidebar'
import { useSearchStore } from '../searchStore'

vi.mock('../../../api/networks', () => ({
  useSaveNetwork: () => ({ mutate: vi.fn(), isPending: false }),
}))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    createElement(QueryClientProvider, { client: qc },
      createElement(MemoryRouter, null, ui)
    )
  )
}

describe('SearchSidebar — tissue expression filter', () => {
  beforeEach(() => {
    useSearchStore.getState().reset()
    vi.clearAllMocks()
  })

  it('renders the tissue expression dropdown enabled', () => {
    wrap(<SearchSidebar term="BAD" visibleInteractionIds={[]} />)
    const select = screen.getByRole('combobox', { name: /tissue expression/i })
    expect(select).toBeTruthy()
    expect((select as HTMLSelectElement).disabled).toBe(false)
  })

  it('defaults to "All tissues" (empty value)', () => {
    wrap(<SearchSidebar term="BAD" visibleInteractionIds={[]} />)
    const select = screen.getByRole('combobox', { name: /tissue expression/i }) as HTMLSelectElement
    expect(select.value).toBe('')
  })

  it('lists tissue options including Liver and Whole Blood', () => {
    wrap(<SearchSidebar term="BAD" visibleInteractionIds={[]} />)
    expect(screen.getByRole('option', { name: /liver/i })).toBeTruthy()
    expect(screen.getByRole('option', { name: /whole blood/i })).toBeTruthy()
  })

  it('selecting a tissue updates tissueFilter in the store', async () => {
    const user = userEvent.setup()
    wrap(<SearchSidebar term="BAD" visibleInteractionIds={[]} />)
    const select = screen.getByRole('combobox', { name: /tissue expression/i })
    await user.selectOptions(select, 'liver')
    expect(useSearchStore.getState().tissueFilter).toBe('liver')
  })

  it('selecting "All tissues" resets tissueFilter to empty string', async () => {
    useSearchStore.getState().setTissueFilter('liver')
    const user = userEvent.setup()
    wrap(<SearchSidebar term="BAD" visibleInteractionIds={[]} />)
    const select = screen.getByRole('combobox', { name: /tissue expression/i })
    await user.selectOptions(select, '')
    expect(useSearchStore.getState().tissueFilter).toBe('')
  })
})
