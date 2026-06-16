import { Link } from 'react-router-dom'
import { Search, BookOpen, Download } from 'lucide-react'
import { useSettings } from '../../api/settings'
import { useCounts } from '../../api/counts'
import { useAnnouncements } from '../../api/announcements'
import { HeroSection } from './HeroSection'
import { AnnouncementsList } from './AnnouncementsList'

const ACTION_CARDS = [
  {
    icon: Search,
    title: 'Search by gene',
    desc: 'Enter a UniProt or HGNC identifier - find every protein it touches.',
    accent: 'var(--primary)',
    to: '/search',
  },
  {
    icon: BookOpen,
    title: 'Browse the atlas',
    desc: 'Pre-built views into HI-III, Lit-BM, HuRI and the literature.',
    accent: 'var(--accent)',
    to: '/about',
  },
  {
    icon: Download,
    title: 'Bulk download',
    desc: 'PSI-MI tab, SIF, CSV - pick your format and pull the whole dataset.',
    accent: 'var(--accent-2)',
    to: '/download',
  },
]

export function HomePage() {
  const { data: settings } = useSettings()
  const { data: counts } = useCounts()
  const { data: announcements } = useAnnouncements()

  return (
    <div style={{ background: 'var(--bg)' }}>
      <HeroSection
        shortTitle={settings?.shortTitle ?? ''}
        proteins={counts?.proteins ?? 0}
        interactions={counts?.interactions ?? 0}
        datasets={counts?.datasets ?? 0}
      />

      {/* Three ways to start */}
      <section style={{ padding: '40px 80px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              margin: '0 0 20px',
            }}
          >
            Three ways to start
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {ACTION_CARDS.map(({ icon: Icon, title, desc, accent, to }) => (
              <Link
                key={to + title}
                to={to}
                className="op-card"
                style={{
                  padding: 24,
                  textDecoration: 'none',
                  display: 'block',
                  transition: 'box-shadow .15s, transform .15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.transform = ''
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `color-mix(in oklab, ${accent} 14%, transparent)`,
                    color: accent,
                    display: 'grid',
                    placeItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Icon size={20} aria-hidden />
                </div>
                <div
                  style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}
                >
                  {title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  {desc}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* News + Cite */}
      <section style={{ padding: '0 80px 80px' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: 32,
          }}
        >
          {/* News card */}
          <div className="op-card" style={{ padding: 28 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                marginBottom: 16,
              }}
            >
              News
            </div>
            <AnnouncementsList announcements={announcements ?? []} />
          </div>

          {/* Cite card */}
          <div
            className="op-card"
            style={{
              padding: 28,
              background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
              color: '#fff',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  opacity: 0.8,
                  textTransform: 'uppercase',
                  letterSpacing: '.1em',
                  marginBottom: 12,
                }}
              >
                Cite openPIP
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 24px' }}>
                If openPIP supports your research, please cite the platform and the
                underlying source datasets.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="op-btn"
                style={{
                  background: 'rgba(255,255,255,.16)',
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,.25)',
                  fontSize: 13,
                }}
                onClick={() => {
                  navigator.clipboard
                    .writeText(
                      '@article{helmy2022openpip, title={openPIP}, journal={Journal of Molecular Biology}, year={2022}}'
                    )
                    .catch(() => {})
                }}
              >
                Copy BibTeX
              </button>
              <Link
                to="/about"
                className="op-btn"
                style={{
                  background: 'rgba(255,255,255,.08)',
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,.15)',
                  fontSize: 13,
                }}
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
