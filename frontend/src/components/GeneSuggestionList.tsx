interface GeneSuggestionListProps {
  idPrefix: string
  suggestions: string[]
  activeIndex: number
  setActiveIndex: (i: number) => void
  onSelect: (v: string) => void
}

/** Dropdown list of gene suggestions. Pair with useGeneAutocomplete; render
 * inside a `position: relative` container. */
export function GeneSuggestionList({
  idPrefix,
  suggestions,
  activeIndex,
  setActiveIndex,
  onSelect,
}: GeneSuggestionListProps) {
  return (
    <ul
      id={`${idPrefix}-list`}
      role="listbox"
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        right: 0,
        margin: 0,
        padding: 4,
        listStyle: 'none',
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 8,
        boxShadow: 'var(--shadow-lg)',
        zIndex: 20,
        maxHeight: 260,
        overflowY: 'auto',
      }}
    >
      {suggestions.map((s, i) => (
        <li
          key={s}
          id={`${idPrefix}-option-${i}`}
          role="option"
          aria-selected={i === activeIndex}
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(s)
          }}
          onMouseEnter={() => setActiveIndex(i)}
          style={{
            padding: '7px 12px',
            borderRadius: 6,
            fontSize: 14,
            fontFamily: 'var(--mono)',
            cursor: 'pointer',
            color: 'var(--text)',
            background: i === activeIndex ? 'var(--primary-soft)' : 'transparent',
          }}
        >
          {s}
        </li>
      ))}
    </ul>
  )
}
