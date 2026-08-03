import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  applyBranding,
  applyDocumentTitle,
  applyFavicon,
  applyManifest,
  applyThemeColor,
  buildManifest,
  DEFAULT_FAVICON,
} from '../branding'
import type { AdminSettings } from '../../types/api'

/**
 * `new Image()` never loads in jsdom, so each test drives the outcome: the
 * stub records the instance and the test fires load or error on it.
 */
class FakeImage {
  static last: FakeImage | null = null
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  src = ''
  constructor() {
    FakeImage.last = this
  }
}

const settings = (over: Partial<AdminSettings> = {}) => over as AdminSettings

const iconHref = (rel: string) =>
  document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)?.getAttribute('href')

/**
 * jsdom cannot fetch a blob: URL, so object URLs are stubbed: the manifest is
 * read from the Blob handed to createObjectURL rather than over the network.
 */
let lastBlob: Blob | null = null
let blobsCreated = 0

async function linkedManifest() {
  const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href
  expect(href?.startsWith('blob:')).toBe(true)
  return JSON.parse(await (lastBlob as Blob).text())
}

describe('branding', () => {
  beforeEach(() => {
    document.head.innerHTML =
      '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />' +
      '<link rel="manifest" href="/manifest.webmanifest" />' +
      '<meta name="theme-color" content="#2563eb" />'
    document.title = 'openPIP'
    FakeImage.last = null
    lastBlob = null
    vi.stubGlobal('Image', FakeImage)
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      lastBlob = blob as Blob
      return `blob:test/${++blobsCreated}`
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('applyFavicon', () => {
    it('uses the shipped mark when no logo is set', () => {
      applyFavicon(null)
      expect(iconHref('icon')).toBe(DEFAULT_FAVICON)
      expect(iconHref('apple-touch-icon')).toBe(DEFAULT_FAVICON)
    })

    it('treats a blank logo url as no logo', () => {
      applyFavicon('   ')
      expect(iconHref('icon')).toBe(DEFAULT_FAVICON)
    })

    it('points the tab and home-screen icons at an uploaded logo', () => {
      applyFavicon('/media/logos/lab.png')
      // Nothing changes until the file is known to load.
      expect(iconHref('icon')).toBe('/favicon.svg')

      FakeImage.last?.onload?.()

      expect(iconHref('icon')).toBe('/media/logos/lab.png')
      expect(iconHref('apple-touch-icon')).toBe('/media/logos/lab.png')
      expect(document.querySelector('link[rel="icon"]')).toHaveAttribute('type', 'image/png')
    })

    it('keeps the shipped mark when the logo fails to load', () => {
      applyFavicon('/media/logos/deleted.png')
      FakeImage.last?.onerror?.()

      expect(iconHref('icon')).toBe(DEFAULT_FAVICON)
    })

    it('drops a stale type when the new icon has no known extension', () => {
      applyFavicon('/media/logos/upload')
      FakeImage.last?.onload?.()

      expect(document.querySelector('link[rel="icon"]')).not.toHaveAttribute('type')
    })
  })

  describe('applyDocumentTitle', () => {
    it('uses the configured site title', () => {
      applyDocumentTitle(settings({ title: 'Yeast PIP', shortTitle: 'yPIP' }))
      expect(document.title).toBe('Yeast PIP')
    })

    it('falls back to the short title, then to openPIP', () => {
      applyDocumentTitle(settings({ title: '   ', shortTitle: 'yPIP' }))
      expect(document.title).toBe('yPIP')

      applyDocumentTitle(settings())
      expect(document.title).toBe('openPIP')
    })
  })

  describe('applyThemeColor', () => {
    it('tints mobile browser chrome with the site colour', () => {
      applyThemeColor(settings({ mainColorScheme: '#a51c30' }))
      expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
        'content',
        '#a51c30'
      )
    })
  })

  describe('buildManifest', () => {
    it('names the installed app after the site and uses its logo', () => {
      const manifest = buildManifest(
        settings({
          title: 'Yeast PIP',
          shortTitle: 'yPIP',
          logoUrl: '/media/logos/lab.png',
          mainColorScheme: '#a51c30',
        })
      )

      expect(manifest.name).toBe('Yeast PIP')
      expect(manifest.short_name).toBe('yPIP')
      expect(manifest.theme_color).toBe('#a51c30')
      expect(manifest.icons[0].src).toBe(`${window.location.origin}/media/logos/lab.png`)
      expect(manifest.icons[0].type).toBe('image/png')
    })

    it('falls back to the shipped mark and defaults', () => {
      const manifest = buildManifest(null)
      expect(manifest.name).toBe('openPIP')
      expect(manifest.theme_color).toBe('#2563eb')
      expect(manifest.icons[0].src).toBe(`${window.location.origin}${DEFAULT_FAVICON}`)
    })

    it('uses absolute urls, which a blob-hosted manifest cannot resolve without', () => {
      const manifest = buildManifest(null)
      for (const url of [manifest.start_url, manifest.scope, manifest.icons[0].src]) {
        expect(url.startsWith('http')).toBe(true)
      }
    })
  })

  describe('applyManifest', () => {
    it('serves the settings-derived manifest to the link tag', async () => {
      applyManifest(settings({ title: 'Yeast PIP' }))

      const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
      expect(link?.href.startsWith('blob:')).toBe(true)
      expect((await linkedManifest()).name).toBe('Yeast PIP')
    })

    it('releases the previous blob when the settings change', () => {
      applyManifest(settings({ title: 'First' }))
      const first = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href

      applyManifest(settings({ title: 'Second' }))

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(first)
      expect(document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href).not.toBe(first)
    })

    it('does nothing when the page has no manifest link', () => {
      document.head.innerHTML = ''
      expect(() => applyManifest(settings())).not.toThrow()
    })
  })

  it('applyBranding covers every browser-chrome surface at once', async () => {
    applyBranding(settings({ title: 'Yeast PIP', mainColorScheme: '#a51c30' }))

    expect(document.title).toBe('Yeast PIP')
    expect(iconHref('icon')).toBe(DEFAULT_FAVICON)
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#a51c30')
    expect((await linkedManifest()).name).toBe('Yeast PIP')
  })
})
