import { useSettings } from '../../api/settings'
import { useCounts } from '../../api/counts'
import { useAnnouncements } from '../../api/announcements'
import { HeroSection } from './HeroSection'
import { MissionSection } from './MissionSection'
import { MiniNetworkGraph } from './MiniNetworkGraph'
import { AnnouncementsList } from './AnnouncementsList'
import { ImageCarousel } from './ImageCarousel'
import { MethodsSection } from './MethodsSection'

const EXAMPLE_PROTEINS = ['BAD', 'BCL2L1', 'BCL2L2', 'BAK1', 'BMF', 'MCL1', 'BCL2L11', 'BIK']

export function HomePage() {
  const { data: settings } = useSettings()
  const { data: counts } = useCounts()
  const { data: announcements } = useAnnouncements()

  return (
    <div>
      <HeroSection
        shortTitle={settings?.shortTitle ?? ''}
        proteins={counts?.proteins ?? 0}
        interactions={counts?.interactions ?? 0}
      />

      <section className="py-16 px-6" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <MissionSection
            title={settings?.missionTitle ?? ''}
            text={settings?.missionText ?? ''}
          />
          <MiniNetworkGraph proteins={EXAMPLE_PROTEINS} />
        </div>
      </section>

      <section className="py-14 px-6" style={{ backgroundColor: 'var(--surface-alt)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <AnnouncementsList announcements={announcements ?? []} />
          <ImageCarousel />
        </div>
      </section>

      <MethodsSection
        title={settings?.methodTitle ?? ''}
        text={settings?.methodText ?? ''}
      />
    </div>
  )
}
