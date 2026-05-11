import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { MissionSection } from './MissionSection'

describe('MissionSection', () => {
  it('renders mission title HTML', () => {
    render(
      <MemoryRouter>
        <MissionSection title="<h4>Our Mission</h4>" text="<p>We study proteins</p>" />
      </MemoryRouter>
    )
    expect(screen.getByText('Our Mission')).toBeInTheDocument()
    expect(screen.getByText('We study proteins')).toBeInTheDocument()
  })

  it('renders Search, About, and Download quick links', () => {
    render(
      <MemoryRouter>
        <MissionSection title="" text="" />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /search/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /download/i })).toBeInTheDocument()
  })
})
