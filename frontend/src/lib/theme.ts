import type { AdminSettings } from '../types/api'

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if ([r, g, b].some(isNaN)) return null
  return [r, g, b]
}

function mixWith(hex: string, target: number, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const [r, g, b] = rgb
  const mix = (c: number) => Math.round(c * amount + target * (1 - amount))
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

function darken(hex: string, factor: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const [r, g, b] = rgb
  const d = (c: number) => Math.round(c * (1 - factor))
  return `rgb(${d(r)}, ${d(g)}, ${d(b)})`
}

function lighten(hex: string, factor: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const [r, g, b] = rgb
  const l = (c: number) => Math.round(c + (255 - c) * factor)
  return `rgb(${l(r)}, ${l(g)}, ${l(b)})`
}

export function injectCSSVars(settings: AdminSettings): void {
  const root = document.documentElement
  const isDark = root.dataset.theme === 'dark'

  const primary  = settings.mainColorScheme  || '#2563eb'
  const primary2 = settings.mainColorScheme2 || '#0ea5e9'
  const angle    = settings.gradientAngle    ?? 135
  const style    = settings.navStyle         || 'solid'

  // Primary brand color + derived shades - dark mode needs lighter/darker inverted values
  root.style.setProperty('--primary',      primary)
  root.style.setProperty('--primary-soft', isDark ? mixWith(primary, 0, 0.14)   : mixWith(primary, 255, 0.14))
  root.style.setProperty('--primary-deep', isDark ? lighten(primary, 0.50)      : darken(primary, 0.25))

  // Header background - solid, gradient, or light (white)
  let navBg: string
  if (style === 'gradient') {
    navBg = `linear-gradient(${angle}deg, ${primary}, ${primary2})`
  } else if (style === 'light') {
    navBg = 'var(--surface)'
  } else {
    navBg = primary
  }
  root.style.setProperty('--nav-bg', navBg)

  // Header text color: auto-dark when light nav, otherwise admin-set
  const headerText = style === 'light'
    ? 'var(--text)'
    : (settings.headerColorScheme || '#ffffff')
  root.style.setProperty('--color-header', headerText)

  // Legacy admin slots
  root.style.setProperty('--color-main',   primary)
  root.style.setProperty('--color-logo',   settings.logoColorScheme   || '#ffffff')
  root.style.setProperty('--color-button', settings.buttonColorScheme || primary)

  // Network viz - node colors (also drive --query / --interactor via CSS)
  root.style.setProperty('--color-query-node',      settings.queryNodeColor      || '#e11d48')
  root.style.setProperty('--color-interactor-node', settings.interactorNodeColor || '#2563eb')

  // Network viz - edge colors (also drive --literature / --hi-union / --huri-lit via CSS)
  root.style.setProperty('--color-edge-published',  settings.publishedEdgeColor  || '#38761d')
  root.style.setProperty('--color-edge-validated',  settings.validatedEdgeColor  || '#1155cc')
  root.style.setProperty('--color-edge-verified',   settings.verifiedEdgeColor   || '#cc0000')
  root.style.setProperty('--color-edge-literature', settings.literatureEdgeColor || '#0ea5e9')
  root.style.setProperty('--color-edge-mixed', '#ff55dd')
}
