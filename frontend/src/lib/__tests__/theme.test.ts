import { describe, expect, it, beforeEach } from 'vitest'
import type { AdminSettings } from '../../types/api'
import { injectCSSVars } from '../theme'

/** Tokens from index.css that the derived brand shades are drawn against. */
const SURFACE = { dark: '#11161f', light: '#ffffff' }
const TRACK = { dark: '#232b3a', light: '#e5e9ef' }

function toRgb(value: string): [number, number, number] {
  if (value.startsWith('#')) {
    const hex = value.slice(1)
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ]
  }
  const parts = value.match(/\d+/g) ?? []
  return [+parts[0], +parts[1], +parts[2]]
}

function luminance([r, g, b]: number[]): number {
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(toRgb(a)), luminance(toRgb(b))]
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

function applyBrand(brand: string, theme: 'dark' | 'light') {
  document.documentElement.dataset.theme = theme
  injectCSSVars({ mainColorScheme: brand } as AdminSettings)
  const style = document.documentElement.style
  return {
    soft: style.getPropertyValue('--primary-soft'),
    deep: style.getPropertyValue('--primary-deep'),
    primary: style.getPropertyValue('--primary'),
  }
}

// The admin panel lets an operator set any brand hex, including the near-black
// #0f172a openPIP actually ships and the degenerate pure black/white.
const BRANDS = ['#0f172a', '#2563eb', '#0ea5e9', '#e11d48', '#38761d', '#ffffff', '#000000']
const THEMES = ['dark', 'light'] as const

describe('injectCSSVars brand shades', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  it.each(BRANDS.flatMap((brand) => THEMES.map((theme) => [brand, theme] as const)))(
    'keeps --primary-deep legible on --primary-soft for %s in %s mode',
    (brand, theme) => {
      const { soft, deep } = applyBrand(brand, theme)
      // WCAG AA for normal-size text: chips and badges pair these two directly.
      expect(contrast(deep, soft)).toBeGreaterThanOrEqual(4.5)
    }
  )

  it.each(BRANDS.flatMap((brand) => THEMES.map((theme) => [brand, theme] as const)))(
    'keeps --primary-deep visible as a bar fill for %s in %s mode',
    (brand, theme) => {
      const { deep } = applyBrand(brand, theme)
      // WCAG AA for graphical objects — tissue-expression bars are drawn on --border.
      expect(contrast(deep, TRACK[theme])).toBeGreaterThanOrEqual(3)
    }
  )

  it('lifts --primary-soft above the dark surface rather than below it', () => {
    // Regression: mixing toward pure black put the chip tint *darker* than the
    // surface it sits on, at 1.02:1 for the shipped brand — invisible.
    for (const brand of BRANDS) {
      const { soft } = applyBrand(brand, 'dark')
      expect(luminance(toRgb(soft))).toBeGreaterThan(luminance(toRgb(SURFACE.dark)))
    }
  })

  it('leaves --primary as the operator set it', () => {
    // Only the derived shades adapt; the brand colour itself is not second-guessed.
    expect(applyBrand('#0f172a', 'dark').primary).toBe('#0f172a')
    expect(applyBrand('#0f172a', 'light').primary).toBe('#0f172a')
  })

  it('falls back to the default brand when no colour is configured', () => {
    document.documentElement.dataset.theme = 'light'
    injectCSSVars({} as AdminSettings)
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#2563eb')
  })
})
