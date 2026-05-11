import type { AdminSettings } from '../types/api'

export function injectCSSVars(settings: AdminSettings): void {
  const root = document.documentElement
  root.style.setProperty('--color-main', settings.mainColorScheme)
  root.style.setProperty('--color-header', settings.headerColorScheme)
  root.style.setProperty('--color-logo', settings.logoColorScheme)
  root.style.setProperty('--color-button', settings.buttonColorScheme)
  root.style.setProperty('--color-query-node', settings.queryNodeColor)
  root.style.setProperty('--color-interactor-node', settings.interactorNodeColor)
  root.style.setProperty('--color-edge-published', settings.publishedEdgeColor)
  root.style.setProperty('--color-edge-validated', settings.validatedEdgeColor)
  root.style.setProperty('--color-edge-verified', settings.verifiedEdgeColor)
  root.style.setProperty('--color-edge-literature', settings.literatureEdgeColor)
  root.style.setProperty('--color-edge-mixed', '#ff55dd')
}
