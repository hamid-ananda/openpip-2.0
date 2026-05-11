import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useSearchStore } from '../searchStore'

export function ExternalLinksDropdown() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const allProteins = useSearchStore((s) => s.allProteins)

  // Show only the first 5 proteins
  const topProteins = allProteins.slice(0, 5)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative inline-block" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-50"
      >
        External Links
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded shadow-lg p-3 w-72">
          <div className="text-sm font-medium mb-2">External resources for top proteins</div>

          {topProteins.length === 0 && (
            <div className="text-sm text-gray-500">No proteins loaded.</div>
          )}

          {topProteins.map((protein) => (
            <div key={protein.protein_id} className="mb-2">
              <div className="text-sm font-medium text-gray-700 mb-1">
                {protein.protein_gene_name}
              </div>
              <div className="flex gap-3 text-sm">
                <a
                  href={`https://string-db.org/network/${protein.protein_ensembl_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  STRING
                </a>
                <a
                  href={`https://www.uniprot.org/uniprot/${protein.protein_uniprot_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  UniProt
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
