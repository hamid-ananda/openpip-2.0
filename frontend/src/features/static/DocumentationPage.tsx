export function DocumentationPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--color-main)' }}>
        Documentation
      </h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900">Searching</h2>
        <p className="text-gray-600 mb-3">
          Enter one or more gene names, UniProt IDs, or Ensembl IDs separated by commas or
          newlines. The database will return all known interactions involving your query proteins.
        </p>
        <h3 className="font-medium text-gray-800 mb-2">Example queries</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
          <li>
            <code className="bg-gray-100 px-1 rounded">BAD</code> - single protein
          </li>
          <li>
            <code className="bg-gray-100 px-1 rounded">BAD,BCL2L1,BAK1</code> - multiple proteins
          </li>
          <li>
            <code className="bg-gray-100 px-1 rounded">Q92934</code> - UniProt accession
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900">Filtering Results</h2>
        <p className="text-gray-600 mb-3">
          Use the Filter button in the toolbar to narrow results by:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
          <li>
            <strong>Score threshold</strong> - minimum interaction confidence score (0–1)
          </li>
          <li>
            <strong>Evidence category</strong> - Published, Validated, Verified, or Literature
          </li>
          <li>
            <strong>Filter mode</strong> - show all, query↔query only, or query↔interactor only
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900">Downloading Data</h2>
        <p className="text-gray-600 mb-3">
          After running a search, use the Download button to export the results. Login is required.
          Available formats:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
          <li>
            <strong>SIF</strong> - Simple Interaction Format (tab-separated: A pp B)
          </li>
          <li>
            <strong>Interactions CSV</strong> - all interaction data as comma-separated values
          </li>
          <li>
            <strong>Interactors CSV</strong> - protein metadata as comma-separated values
          </li>
          <li>
            <strong>FASTA</strong> - protein sequences
          </li>
          <li>
            <strong>PSI-MI</strong> - MITAB 2.5 format (42 columns)
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3 text-gray-900">Network Visualization</h2>
        <p className="text-gray-600 mb-3">
          Results are displayed as an interactive network. Use the Layout button to switch
          between force-directed (Cola, CoSE), concentric, circle, and grid layouts. Click any node
          or edge to see details. Scroll to zoom, drag to pan.
        </p>
      </section>
    </div>
  )
}
