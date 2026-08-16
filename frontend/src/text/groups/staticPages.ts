import type { TextGroup } from '../types'

export const faqGroup: TextGroup = {
  id: 'faq',
  label: 'FAQ page',
  route: '/faq',
  description: 'Page chrome. The questions and answers are edited under FAQ content above.',
  entries: [
    {
      key: 'faq.title',
      label: 'Page title',
      section: 'Page header',
      default: 'Frequently Asked Questions',
    },
    {
      key: 'faq.empty',
      label: 'Empty state',
      default: 'No FAQ content has been set. Add content in Admin → FAQs.',
    },
  ],
}

export const contactGroup: TextGroup = {
  id: 'contact',
  label: 'Contact page',
  route: '/contact',
  description: 'Page title only. The contact details themselves are edited under Contact above.',
  entries: [
    {
      key: 'contact.title',
      label: 'Page title',
      section: 'Page header',
      default: 'Contact',
    },
  ],
}

export const downloadsGroup: TextGroup = {
  id: 'downloads',
  label: 'Downloads page',
  route: '/download',
  description: 'Page chrome and table labels. The intro block is edited under Downloads above.',
  entries: [
    {
      key: 'downloads.chip',
      label: 'Header chip',
      section: 'Page header',
      default: 'Bulk data',
    },
    {
      key: 'downloads.title',
      label: 'Page title',
      section: 'Page header',
      default: 'Downloads',
    },
    {
      key: 'downloads.subtitle',
      label: 'Page subtitle',
      section: 'Page header',
      kind: 'multiline',
      default:
        'Every dataset hosted on openPIP, available as PSI-MI tab, SIF, or CSV, free to download: no account required.',
    },

    {
      key: 'downloads.loading',
      label: 'Loading state',
      default: 'Loading datasets…',
    },
    {
      key: 'downloads.table.dataset',
      label: 'Column: dataset',
      default: 'Dataset',
    },
    { key: 'downloads.table.year', label: 'Column: year', default: 'Year' },
    {
      key: 'downloads.table.download',
      label: 'Column: download',
      default: 'Download',
    },
  ],
}
