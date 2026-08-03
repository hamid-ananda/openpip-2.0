import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, BookOpen, Download } from 'lucide-react'
import { useSettings } from '../../api/settings'
import { useCounts } from '../../api/counts'
import { useAnnouncements } from '../../api/announcements'
import { HeroSection } from './HeroSection'
import { AnnouncementsList } from './AnnouncementsList'
import { useText } from '../../text'

const ACTION_CARDS = [
  {
    icon: Search,
    titleKey: 'home.cards.search.title',
    descKey: 'home.cards.search.desc',
    accent: 'var(--primary)',
    to: '/search',
  },
  {
    icon: BookOpen,
    titleKey: 'home.cards.browse.title',
    descKey: 'home.cards.browse.desc',
    accent: 'var(--accent)',
    to: '/proteins',
  },
  {
    icon: Download,
    titleKey: 'home.cards.download.title',
    descKey: 'home.cards.download.desc',
    accent: 'var(--accent-2)',
    to: '/download',
  },
]

/**
 * Renders admin-editable homepage prose (mission / methods) from the site-text
 * registry. Both title and body are HTML authored in the admin editor; the
 * section is omitted entirely when the admin has blanked both.
 */
function ContentSection({ title, body }: { title?: string | null; body?: string | null }) {
  if (!title?.trim() && !body?.trim()) return null
  return (
    <section style={{ padding: '0 80px 40px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="op-card" style={{ padding: 32 }}>
          {title?.trim() && (
            <div
              style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}
              dangerouslySetInnerHTML={{ __html: title }}
            />
          )}
          {body?.trim() && (
            <div
              style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text-muted)' }}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          )}
        </div>
      </div>
    </section>
  )
}

export function HomePage() {
  const { data: settings } = useSettings()
  const { data: counts } = useCounts()
  const { data: announcements } = useAnnouncements()
  const t = useText()
  const [copied, setCopied] = useState(false)

  return (
    <div style={{ background: 'var(--bg)' }}>
      <HeroSection
        shortTitle={settings?.shortTitle ?? ''}
        proteins={counts?.proteins ?? 0}
        interactions={counts?.interactions ?? 0}
        datasets={counts?.datasets ?? 0}
      />

      <ContentSection title={t('home.mission.heading')} body={t('home.mission.body')} />

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
            {t('home.cards.heading')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {ACTION_CARDS.map(({ icon: Icon, titleKey, descKey, accent, to }) => (
              <Link
                key={to + titleKey}
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
                  {t(titleKey)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  {t(descKey)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ContentSection title={t('home.methods.heading')} body={t('home.methods.body')} />

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
              {t('home.news.heading')}
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
                {t('home.cite.heading')}
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 24px' }}>
                {t('home.cite.body')}
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
                    .writeText(t('home.cite.bibtex'))
                    .then(() => {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    })
                    .catch(() => {})
                }}
              >
                {copied ? t('home.cite.copiedButton') : t('home.cite.copyButton')}
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
                {t('home.cite.learnMore')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
