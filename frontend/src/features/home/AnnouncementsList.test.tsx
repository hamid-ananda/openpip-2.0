import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import { AnnouncementsList } from './AnnouncementsList'
import type { Announcement } from '../../types/api'

const announcements: Announcement[] = [
  { id: 1, title: 'New release', text: '<p>v2 is out</p>', date: '2026-05-01', show: true, showOnHomePage: true },
  { id: 2, title: 'Maintenance', text: '<p>Scheduled downtime</p>', date: '2026-04-10', show: true, showOnHomePage: true },
]

describe('AnnouncementsList', () => {
  it('renders each announcement title', () => {
    renderWithProviders(<AnnouncementsList announcements={announcements} />)
    expect(screen.getByText('New release')).toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
  })

  it('renders dates', () => {
    renderWithProviders(<AnnouncementsList announcements={announcements} />)
    expect(screen.getByText('2026-05-01')).toBeInTheDocument()
  })

  it('renders HTML content', () => {
    renderWithProviders(<AnnouncementsList announcements={announcements} />)
    expect(screen.getByText('v2 is out')).toBeInTheDocument()
  })

  it('renders a list container when empty', () => {
    const { container } = renderWithProviders(<AnnouncementsList announcements={[]} />)
    expect(container.querySelector('[data-testid="announcements"]')).toBeInTheDocument()
  })
})
