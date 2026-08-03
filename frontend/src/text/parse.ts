/**
 * Parsers for the small line-based formats the registry uses, so an admin can
 * edit a list or a reference table as plain text instead of hand-writing HTML.
 */

export interface PipeRow {
  term: string
  description: string
}

/**
 * Parses `"term | description"` lines. Blank lines are skipped, and a line with
 * no separator becomes a term with no description.
 */
export function parsePipeList(value: string): PipeRow[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.indexOf('|')
      if (sep === -1) return { term: line, description: '' }
      return {
        term: line.slice(0, sep).trim(),
        description: line.slice(sep + 1).trim(),
      }
    })
}

/** Parses a newline-separated list, dropping blank lines. */
export function parseLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}
