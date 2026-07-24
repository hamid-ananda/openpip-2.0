import { useState } from 'react'
import { useAutocomplete } from '../api/proteins'

/**
 * Shared gene-search autocomplete used by the homepage hero and the search-page
 * sidebar. Token-aware: the query may hold several comma-separated genes, so it
 * completes the token after the last comma and leaves earlier ones intact.
 * Selecting via mouse uses onMouseDown + preventDefault so the input keeps focus
 * (no blur), letting the user keep typing. Pair with <GeneSuggestionList/>.
 */
export function useGeneAutocomplete(value: string, onChange: (v: string) => void, idPrefix: string) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const tokens = value.split(',')
  const activeToken = (tokens[tokens.length - 1] ?? '').trim()
  const chosen = tokens.slice(0, -1).map((t) => t.trim().toLowerCase())
  const { data: raw = [] } = useAutocomplete(activeToken)
  const suggestions = raw.filter((s) => !chosen.includes(s.toLowerCase()))
  const showList = showSuggestions && activeToken.length >= 2 && suggestions.length > 0

  const selectSuggestion = (v: string) => {
    const head = tokens
      .slice(0, -1)
      .map((t) => t.trim())
      .filter(Boolean)
    onChange([...head, v].join(', '))
    setShowSuggestions(false)
    setActiveIndex(-1)
  }

  const inputProps = {
    role: 'combobox' as const,
    'aria-autocomplete': 'list' as const,
    'aria-expanded': showList,
    'aria-controls': `${idPrefix}-list`,
    'aria-activedescendant': activeIndex >= 0 ? `${idPrefix}-option-${activeIndex}` : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
      setShowSuggestions(true)
      setActiveIndex(-1)
    },
    onFocus: () => setShowSuggestions(true),
    onBlur: () => window.setTimeout(() => setShowSuggestions(false), 120),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showList) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        selectSuggestion(suggestions[activeIndex])
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
        setActiveIndex(-1)
      }
    },
  }

  return { showList, suggestions, activeIndex, setActiveIndex, selectSuggestion, inputProps }
}
