import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TopBar } from './TopBar'

describe('TopBar', () => {
  it('renders the site short title', () => {
    render(<TopBar shortTitle="HuRI" />)
    expect(screen.getByText('HuRI')).toBeInTheDocument()
  })

  it('renders an SVG logo element', () => {
    const { container } = render(<TopBar shortTitle="HuRI" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
