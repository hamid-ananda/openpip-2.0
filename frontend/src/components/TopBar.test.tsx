import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TopBar } from './TopBar'

describe('TopBar', () => {
  it('renders the site short title', () => {
    render(<TopBar shortTitle="openPIP" />)
    expect(screen.getByText('openPIP')).toBeInTheDocument()
  })

  it('renders an SVG logo element', () => {
    const { container } = render(<TopBar shortTitle="openPIP" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
