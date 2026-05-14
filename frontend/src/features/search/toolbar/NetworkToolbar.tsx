import { FilterDropdown } from './FilterDropdown'
import { LayoutDropdown } from './LayoutDropdown'
import { DownloadDropdown } from './DownloadDropdown'
import { LegendDropdown } from './LegendDropdown'
import { SummaryDropdown } from './SummaryDropdown'
import { ExternalLinksDropdown } from './ExternalLinksDropdown'

export function NetworkToolbar() {
  return (
    <div className="flex flex-wrap gap-2 py-2 relative">
      <FilterDropdown />
      <LayoutDropdown />
      <DownloadDropdown />
      <LegendDropdown />
      <SummaryDropdown />
      <ExternalLinksDropdown />
    </div>
  )
}
