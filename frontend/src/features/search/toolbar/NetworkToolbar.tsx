import { FilterDropdown } from './FilterDropdown'
import { LayoutDropdown } from './LayoutDropdown'
import { DownloadDropdown } from './DownloadDropdown'
import { LegendDropdown } from './LegendDropdown'
import { SummaryDropdown } from './SummaryDropdown'
import { ExternalLinksDropdown } from './ExternalLinksDropdown'

export function NetworkToolbar() {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      padding: '8px 12px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
    }}>
      <FilterDropdown />
      <LayoutDropdown />
      <DownloadDropdown />
      <LegendDropdown />
      <SummaryDropdown />
      <ExternalLinksDropdown />
    </div>
  )
}
