import { useCallback } from 'react'
import { useSiteText } from '../api/siteText'
import { resolveText } from './registry'

export interface TextInterpolations {
  [token: string]: string | number | null | undefined
}

/**
 * Substitutes `{token}` placeholders. Unmatched tokens are left in place so a
 * mis-typed placeholder is visible rather than silently swallowed.
 */
function interpolate(value: string, vars?: TextInterpolations): string {
  if (!vars) return value
  return value.replace(/\{(\w+)\}/g, (match, token) => {
    const replacement = vars[token]
    return replacement === null || replacement === undefined ? match : String(replacement)
  })
}

/**
 * Returns `t(key, vars?)`, which resolves admin-editable copy.
 *
 * Overrides load asynchronously; until they arrive `t` returns the shipped
 * default, so a page never flashes empty and stays fully readable if the
 * request fails.
 */
export function useText() {
  const { data } = useSiteText()
  const overrides = data?.text

  return useCallback(
    (key: string, vars?: TextInterpolations) => interpolate(resolveText(overrides, key), vars),
    [overrides]
  )
}
