import { useCallback, useMemo, useState } from 'react'
import { useSiteText, useUpdateSiteText } from '../../api/siteText'
import { TEXT_ENTRIES } from '../../text'
import type { SiteTextEntry } from '../../types/api'

/** A draft value, where `null` means "explicitly go back to the shipped default". */
export type SiteTextDraftMap = Record<string, string | null>

/**
 * Draft state for the admin-editable site copy.
 *
 * The API stores only overridden keys, so a field is edited in terms of
 * "shipped default" vs "your override": an empty draft means *no* override and
 * the shipped wording shows through as placeholder text. Emptying a field is
 * therefore a delete, not a save of `''` — except for keys flagged `allowBlank`,
 * where blank is a real choice the admin needs to be able to make.
 */
export function useSiteTextDrafts() {
  const { data, isLoading } = useSiteText()
  const { mutate, isPending, isSuccess, isError, reset: resetMutation } = useUpdateSiteText()

  // Memoized so the derived memos below don't recompute on every render just
  // because `?? {}` produced a fresh object.
  const overrides = useMemo(() => data?.text ?? {}, [data])

  // Only the admin's un-saved edits live in state; the stored overrides are
  // layered underneath. Deriving drafts this way means a save (which refreshes
  // `overrides`) needs no re-seeding, and an edit is never clobbered in flight.
  const [edits, setEdits] = useState<SiteTextDraftMap>({})
  const drafts: SiteTextDraftMap = useMemo(() => ({ ...overrides, ...edits }), [overrides, edits])

  const setDraft = useCallback((key: string, value: string) => {
    setEdits((e) => ({ ...e, [key]: value }))
  }, [])

  /** Drop the override for a key, whatever is currently typed in its box. */
  const revertDraft = useCallback((key: string) => {
    setEdits((e) => ({ ...e, [key]: null }))
  }, [])

  const discard = useCallback(() => setEdits({}), [])

  // A draft differs from what's stored: either newly set, changed, or emptied.
  const pending: SiteTextEntry[] = useMemo(() => {
    const out: SiteTextEntry[] = []
    for (const key of Object.keys(TEXT_ENTRIES)) {
      const draft = drafts[key]
      const stored = overrides[key]

      // Untouched, and never overridden.
      if (draft === undefined) continue
      // Reset was clicked: drop the override so the shipped wording returns.
      if (draft === null) {
        if (stored !== undefined) out.push({ key, value: null })
        continue
      }
      // Unchanged. Compared before the empty check so a deliberately blank
      // override (settable via the API) is not silently cleared on save.
      if (draft === stored) continue
      // Emptied by the admin. For most keys that reads as "no override"; for a
      // block that hides itself when blank, the blank is the point, so it is
      // stored as a real override instead.
      if (draft === '') {
        if (TEXT_ENTRIES[key]?.allowBlank) out.push({ key, value: '' })
        else if (stored !== undefined) out.push({ key, value: null })
        continue
      }
      out.push({ key, value: draft })
    }
    return out
  }, [drafts, overrides])

  const pendingKeys = useMemo(() => new Set(pending.map((entry) => entry.key)), [pending])

  const save = useCallback(() => {
    if (pending.length === 0) return
    mutate(pending, { onSuccess: () => setEdits({}) })
  }, [mutate, pending])

  return {
    isLoading,
    overrides,
    drafts,
    setDraft,
    revertDraft,
    discard,
    pending,
    pendingKeys,
    save,
    isPending,
    isSuccess,
    isError,
    resetMutation,
  }
}
