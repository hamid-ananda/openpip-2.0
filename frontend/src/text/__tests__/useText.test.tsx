import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { seedSiteText, resetSiteText } from '../../mocks/handlers/siteText'
import { useText } from '../useText'

function Probe({ textKey, vars }: { textKey: string; vars?: Record<string, string> }) {
  const t = useText()
  return <span data-testid="out">{t(textKey, vars)}</span>
}

function renderProbe(textKey: string, vars?: Record<string, string>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <Probe textKey={textKey} vars={vars} />
    </QueryClientProvider>
  )
}

describe('useText', () => {
  beforeEach(() => {
    resetSiteText()
  })

  it('renders the shipped default immediately, before overrides load', () => {
    renderProbe('nav.home')
    expect(screen.getByTestId('out')).toHaveTextContent('Home')
  })

  it('swaps in an admin override once it loads', async () => {
    seedSiteText({ 'nav.home': 'Start here' })
    renderProbe('nav.home')
    await waitFor(() => expect(screen.getByTestId('out')).toHaveTextContent('Start here'))
  })

  it('keeps the default when the request fails', async () => {
    server.use(http.get('/api/settings/text', () => HttpResponse.error()))
    renderProbe('nav.home')
    await waitFor(() => expect(screen.getByTestId('out')).toHaveTextContent('Home'))
  })

  it('interpolates tokens', async () => {
    seedSiteText({ 'about.title': 'About {title}' })
    renderProbe('about.title', { title: 'openPIP' })
    await waitFor(() => expect(screen.getByTestId('out')).toHaveTextContent('About openPIP'))
  })

  it('leaves an unmatched token visible', () => {
    renderProbe('about.title', {})
    expect(screen.getByTestId('out')).toHaveTextContent('About {title}')
  })
})
