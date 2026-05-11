import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { HeroSection } from './HeroSection'

describe('HeroSection', () => {
  it('renders the site short title', () => {
    render(
      <MemoryRouter>
        <HeroSection shortTitle="HuRI" proteins={8275} interactions={52569} />
      </MemoryRouter>
    )
    expect(screen.getByText('HuRI')).toBeInTheDocument()
  })

  it('renders the search input', () => {
    render(
      <MemoryRouter>
        <HeroSection shortTitle="HuRI" proteins={0} interactions={0} />
      </MemoryRouter>
    )
    expect(screen.getByPlaceholderText(/gene names/i)).toBeInTheDocument()
  })

  it('renders the search button', () => {
    render(
      <MemoryRouter>
        <HeroSection shortTitle="HuRI" proteins={0} interactions={0} />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })
})
