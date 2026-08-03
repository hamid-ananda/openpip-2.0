import type { AdminSettings } from '../types/api'

/**
 * Puts the site's branding everywhere the browser shows it, rather than only
 * inside the page: the tab icon, the tab title, and the manifest an installed
 * copy takes its name and icon from.
 *
 * All three follow the admin settings, so a deployment that uploads its own
 * logo and renames itself is that site in the browser chrome too, not openPIP.
 */

/** The mark that ships with the app, resolved against the deploy's base path. */
export const DEFAULT_FAVICON = `${import.meta.env.BASE_URL}favicon.svg`

/** Used for the tab and the installed app when no title has been set. */
export const FALLBACK_TITLE = 'openPIP'

/** `rel` values worth pointing at the logo: the tab, and iOS home screens. */
const ICON_RELS = ['icon', 'apple-touch-icon'] as const

// ─────────────────────────────────────────────────────────
// Favicon
// ─────────────────────────────────────────────────────────

/** Browsers sniff the bytes, but a correct `type` avoids a re-request. */
function mimeFor(url: string): string {
  const path = url.split(/[?#]/)[0].toLowerCase()
  if (path.endsWith('.svg')) return 'image/svg+xml'
  if (path.endsWith('.png')) return 'image/png'
  if (path.endsWith('.ico')) return 'image/x-icon'
  if (path.endsWith('.gif')) return 'image/gif'
  if (path.endsWith('.webp')) return 'image/webp'
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg'
  return ''
}

function setLink(rel: string, href: string) {
  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    document.head.appendChild(link)
  }
  const type = mimeFor(href)
  // A stale type from the previous icon would misdescribe the new one.
  if (type) link.type = type
  else link.removeAttribute('type')
  if (link.href !== href) link.href = href
}

/**
 * Applies `logoUrl` as the favicon, or the shipped mark when it is blank.
 *
 * A logo that fails to load would otherwise leave the tab iconless, so the URL
 * is loaded once first and only swapped in if it resolves.
 */
export function applyFavicon(logoUrl?: string | null): void {
  const url = logoUrl?.trim()
  if (!url) {
    for (const rel of ICON_RELS) setLink(rel, DEFAULT_FAVICON)
    return
  }
  const probe = new Image()
  probe.onload = () => {
    for (const rel of ICON_RELS) setLink(rel, url)
  }
  probe.onerror = () => {
    for (const rel of ICON_RELS) setLink(rel, DEFAULT_FAVICON)
  }
  probe.src = url
}

// ─────────────────────────────────────────────────────────
// Tab title
// ─────────────────────────────────────────────────────────

/** The site's name: its full title, else the short one, else openPIP. */
export function siteTitle(settings?: AdminSettings | null): string {
  return settings?.title?.trim() || settings?.shortTitle?.trim() || FALLBACK_TITLE
}

export function applyDocumentTitle(settings?: AdminSettings | null): void {
  document.title = siteTitle(settings)
}

// ─────────────────────────────────────────────────────────
// Web app manifest
// ─────────────────────────────────────────────────────────

/** Absolute, because a blob-hosted manifest has no useful base to resolve against. */
function absolute(url: string): string {
  return new URL(url, window.location.origin).href
}

export interface WebManifest {
  name: string
  short_name: string
  start_url: string
  scope: string
  display: string
  theme_color: string
  background_color: string
  icons: { src: string; type?: string; sizes: string; purpose: string }[]
}

/** The manifest for these settings: the site's name, colour and logo. */
export function buildManifest(settings?: AdminSettings | null): WebManifest {
  const icon = settings?.logoUrl?.trim() || DEFAULT_FAVICON
  const type = mimeFor(icon)
  return {
    name: siteTitle(settings),
    short_name: settings?.shortTitle?.trim() || FALLBACK_TITLE,
    start_url: absolute(import.meta.env.BASE_URL),
    scope: absolute(import.meta.env.BASE_URL),
    display: 'standalone',
    theme_color: settings?.mainColorScheme?.trim() || '#2563eb',
    background_color: '#ffffff',
    // "any" size: the shipped mark is vector, and an uploaded logo is whatever
    // the admin gave us. Declaring a size we haven't verified would be a lie.
    icons: [{ src: absolute(icon), ...(type ? { type } : {}), sizes: 'any', purpose: 'any' }],
  }
}

/** The blob backing the current manifest, revoked when it is replaced. */
let manifestUrl: string | null = null

/**
 * Points `<link rel="manifest">` at a manifest built from the settings.
 *
 * Served as a blob rather than a static file so an admin renaming the site or
 * uploading a logo changes what an installed copy is called and shows, without
 * a rebuild.
 */
export function applyManifest(settings?: AdminSettings | null): void {
  // jsdom and older browsers have no object URLs; the static manifest stands.
  if (typeof URL.createObjectURL !== 'function') return

  const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (!link) return

  const blob = new Blob([JSON.stringify(buildManifest(settings))], {
    type: 'application/manifest+json',
  })
  const next = URL.createObjectURL(blob)
  if (manifestUrl) URL.revokeObjectURL(manifestUrl)
  manifestUrl = next
  link.href = next
}

/**
 * The colour mobile browsers tint their own chrome with, so the address bar
 * matches the site header rather than the openPIP default blue.
 */
export function applyThemeColor(settings?: AdminSettings | null): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = settings?.mainColorScheme?.trim() || '#2563eb'
}

/** Every browser-chrome surface at once, for the app shell to call. */
export function applyBranding(settings?: AdminSettings | null): void {
  applyFavicon(settings?.logoUrl)
  applyDocumentTitle(settings)
  applyThemeColor(settings)
  applyManifest(settings)
}
