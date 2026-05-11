import { SearchDropdown } from './SearchDropdown'
import { FilterDropdown } from './FilterDropdown'
import { LayoutDropdown } from './LayoutDropdown'
import { DownloadDropdown } from './DownloadDropdown'
import { LegendDropdown } from './LegendDropdown'
import { SummaryDropdown } from './SummaryDropdown'
import { ExternalLinksDropdown } from './ExternalLinksDropdown'

interface NetworkToolbarProps {
  searchTerm: string
}

export function NetworkToolbar({ searchTerm }: NetworkToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 py-2 relative">
      <SearchDropdown currentTerm={searchTerm} />
      <FilterDropdown />
      <LayoutDropdown />
      <DownloadDropdown />
      <LegendDropdown />
      <SummaryDropdown />
      <ExternalLinksDropdown />
    </div>
  )
}
