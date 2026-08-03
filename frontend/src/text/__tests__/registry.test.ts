import { describe, it, expect } from 'vitest'
import { TEXT_GROUPS, TEXT_ENTRIES, TEXT_DEFAULTS, getTextDefault, resolveText } from '../registry'
import { parsePipeList, parseLines } from '../parse'

describe('text registry', () => {
  it('has no duplicate keys across groups', () => {
    const keys = TEXT_GROUPS.flatMap((g) => g.entries.map((e) => e.key))
    const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i)
    expect(duplicates).toEqual([])
  })

  it('exposes every group entry in the flat lookups', () => {
    const keys = TEXT_GROUPS.flatMap((g) => g.entries.map((e) => e.key))
    expect(Object.keys(TEXT_ENTRIES).sort()).toEqual([...keys].sort())
    expect(Object.keys(TEXT_DEFAULTS).sort()).toEqual([...keys].sort())
  })

  it('gives every entry a key, a label, and a string default', () => {
    for (const group of TEXT_GROUPS) {
      for (const entry of group.entries) {
        expect(entry.key, `${group.id} entry missing key`).toBeTruthy()
        expect(entry.label, `${entry.key} missing label`).toBeTruthy()
        expect(typeof entry.default, `${entry.key} default is not a string`).toBe('string')
      }
    }
  })

  it('uses dot-namespaced lowercase-initial keys', () => {
    for (const key of Object.keys(TEXT_ENTRIES)) {
      expect(key, `${key} is not dot-namespaced`).toMatch(/^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)+$/)
    }
  })

  it('has unique group ids', () => {
    const ids = TEXT_GROUPS.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has no empty groups', () => {
    for (const group of TEXT_GROUPS) {
      expect(group.entries.length, `${group.id} is empty`).toBeGreaterThan(0)
    }
  })
})

describe('getTextDefault', () => {
  it('returns the shipped default for a known key', () => {
    expect(getTextDefault('nav.home')).toBe('Home')
  })

  it('returns the key itself for an unknown key so typos are visible', () => {
    expect(getTextDefault('nope.not.a.key')).toBe('nope.not.a.key')
  })
})

describe('resolveText', () => {
  it('falls back to the default with no overrides', () => {
    expect(resolveText(undefined, 'nav.home')).toBe('Home')
    expect(resolveText({}, 'nav.home')).toBe('Home')
  })

  it('prefers an override', () => {
    expect(resolveText({ 'nav.home': 'Start' }, 'nav.home')).toBe('Start')
  })

  it('honours a deliberately blank override', () => {
    expect(resolveText({ 'nav.home': '' }, 'nav.home')).toBe('')
  })

  it('ignores overrides for other keys', () => {
    expect(resolveText({ 'nav.search': 'Find' }, 'nav.home')).toBe('Home')
  })
})

describe('parsePipeList', () => {
  it('splits term and description', () => {
    expect(parsePipeList('SIF | Simple Interaction Format')).toEqual([
      { term: 'SIF', description: 'Simple Interaction Format' },
    ])
  })

  it('keeps later pipes inside the description', () => {
    expect(parsePipeList('a | b | c')).toEqual([{ term: 'a', description: 'b | c' }])
  })

  it('handles a missing separator', () => {
    expect(parsePipeList('Just a term')).toEqual([{ term: 'Just a term', description: '' }])
  })

  it('skips blank lines', () => {
    expect(parsePipeList('a | 1\n\n  \nb | 2')).toHaveLength(2)
  })

  it('returns nothing for empty input', () => {
    expect(parsePipeList('')).toEqual([])
  })
})

describe('parseLines', () => {
  it('drops blank lines and trims', () => {
    expect(parseLines('  /a  \n\n/b\n')).toEqual(['/a', '/b'])
  })
})
