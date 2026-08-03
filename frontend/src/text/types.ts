/**
 * Types for the site-text registry.
 *
 * The registry is the single source of truth for every piece of admin-editable
 * copy: it declares the key, the shipped default, and enough metadata for the
 * admin editor to render a sensible field. The backend stores only overrides,
 * so a key that has never been touched still renders its default here.
 */

/** How the admin editor should present a field, and how the page renders it. */
export type TextKind =
  /** Single-line plain text. Rendered as-is. */
  | 'text'
  /** Multi-line plain text. Rendered as-is. */
  | 'multiline'
  /** HTML authored in the rich-text editor, rendered via dangerouslySetInnerHTML. */
  | 'html'

export interface TextEntry {
  /** Dot-namespaced stable identifier, e.g. `home.hero.headline`. */
  readonly key: string
  /** Admin-facing field label. */
  readonly label: string
  /** The copy that ships with the app; used whenever there is no override. */
  readonly default: string
  readonly kind?: TextKind
  /** Optional guidance shown under the field in the admin editor. */
  readonly hint?: string
  /**
   * The block a visitor actually sees this copy in, e.g. `'Hero'` or
   * `'Cite openPIP'`. The admin editor groups fields under these headings and
   * lists them in the order the blocks appear down the page.
   *
   * Leave it off for chrome — button captions, input placeholders, empty
   * states, loading text, accessible labels. Those are real but rarely edited,
   * so the editor tucks them behind a "Labels & buttons" toggle rather than
   * burying the page's actual prose among them.
   */
  readonly section?: string
  /**
   * Blank is a meaningful value for this key rather than "no override".
   *
   * Most fields treat an empty box as "use the shipped wording", so clearing
   * one deletes the override. A few blocks disappear from the page when their
   * copy is empty, and an admin has to be able to reach that state — for those,
   * an empty box saves a real blank override, and the field's Reset button is
   * the way back to the default.
   */
  readonly allowBlank?: boolean
}

export interface TextGroup {
  /** Stable id, used as the admin editor's section anchor. */
  readonly id: string
  /** Admin-facing section heading. */
  readonly label: string
  /** Route this copy appears on, shown as a "view page" link in the editor. */
  readonly route?: string
  /** Short description of what this section covers. */
  readonly description?: string
  readonly entries: readonly TextEntry[]
}
