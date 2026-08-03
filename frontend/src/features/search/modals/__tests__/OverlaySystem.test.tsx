import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useSearchStore } from '../../searchStore'
import { OverlaySystem } from '../OverlaySystem'
import { renderWithProviders } from '../../../../test/renderWithProviders'

function wrap() {
  return renderWithProviders(<OverlaySystem />)
}

describe('OverlaySystem', () => {
  beforeEach(() => {
    useSearchStore.setState({ activeModal: null })
  })

  afterEach(() => {
    useSearchStore.setState({ activeModal: null })
  })

  it('returns null when no modal is active', () => {
    const { container } = wrap()
    expect(container.firstChild).toBeNull()
  })

  it('renders LoadingOverlay when activeModal is "loading"', () => {
    useSearchStore.setState({ activeModal: 'loading' })
    wrap()
    expect(screen.getByText('Preparing network data for export.')).toBeInTheDocument()
  })

  it('renders DownloadAuthModal when activeModal is "downloadAuth"', () => {
    useSearchStore.setState({ activeModal: 'downloadAuth' })
    wrap()
    expect(screen.getByText('Login Required')).toBeInTheDocument()
  })

  it('renders DownloadModal when activeModal is "download"', () => {
    useSearchStore.setState({ activeModal: 'download' })
    wrap()
    expect(screen.getByText('Download Data')).toBeInTheDocument()
  })
})
