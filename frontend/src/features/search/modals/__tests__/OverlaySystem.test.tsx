import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useSearchStore } from '../../searchStore'
import { OverlaySystem } from '../OverlaySystem'

function wrap() {
  return render(
    <MemoryRouter>
      <OverlaySystem />
    </MemoryRouter>
  )
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
    expect(screen.getByText('Processing...')).toBeInTheDocument()
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
