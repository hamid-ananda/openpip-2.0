import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { TopBar } from './TopBar'

const renderTopBar = (shortTitle: string) =>
  render(
    <MemoryRouter>
      <TopBar shortTitle={shortTitle} />
    </MemoryRouter>
  )

describe('TopBar', () => {
  it('renders the site short title', () => {
    renderTopBar('openPIP')
    expect(screen.getByText('openPIP')).toBeInTheDocument()
  })

  it('renders an SVG logo element', () => {
    const { container } = renderTopBar('openPIP')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('links to the home page', () => {
    renderTopBar('openPIP')
    expect(screen.getByRole('link', { name: /openPIP home/i })).toHaveAttribute('href', '/')
  })
})
