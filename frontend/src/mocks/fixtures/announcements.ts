import type { Announcement } from '../../types/api'

export const announcementsFixture: Announcement[] = [
  {
    id: 1,
    title: 'Welcome to openPIP 2.0',
    text: '<p>We have launched the new version of the portal.</p>',
    date: '2026-05-01',
    show: true,
    showOnHomePage: true,
  },
  {
    id: 2,
    title: 'New dataset added',
    text: '<p>HuRI 2026 dataset is now available for download.</p>',
    date: '2026-04-15',
    show: true,
    showOnHomePage: true,
  },
]

export const adminAnnouncementsFixture: Announcement[] = [
  ...announcementsFixture,
  {
    id: 3,
    title: 'Hidden Maintenance Notice',
    text: '<p>Scheduled downtime on Sunday.</p>',
    date: '2026-03-10',
    show: false,
    showOnHomePage: false,
  },
]
