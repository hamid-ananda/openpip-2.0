import { describe, it, expect } from 'vitest'
import { handlers } from './index'

describe('MSW handlers', () => {
  it('exports an array', () => {
    expect(Array.isArray(handlers)).toBe(true)
  })
})
