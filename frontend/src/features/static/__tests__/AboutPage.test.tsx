import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AboutPage } from '../AboutPage'

vi.mock('../../../api/settings', () => ({
  useSettings: vi.fn(),
}))

import { useSettings } from '../../../api/settings'

const mockSettings = {
  data: {
    title: 'TestDB',
    homePage: '<p>About content</p>',
    version: '2.0',
    url: 'http://test.com',
  },
  isLoading: false,
}

describe('AboutPage', () => {
  it('renders the title with the database name', () => {
    vi.mocked(useSettings).mockReturnValue(
      mockSettings as unknown as ReturnType<typeof useSettings>
    )

    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    )

    expect(screen.getByText('About TestDB')).toBeInTheDocument()
  })

  it('renders static about content', () => {
    vi.mocked(useSettings).mockReturnValue(
      mockSettings as unknown as ReturnType<typeof useSettings>
    )

    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    )

    expect(screen.getByText('CCSB Proteome-scale efforts')).toBeInTheDocument()
  })
})
