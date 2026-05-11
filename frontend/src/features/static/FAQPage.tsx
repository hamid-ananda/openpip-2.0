const FAQS = [
  {
    q: 'What is this database?',
    a: 'This database contains curated protein-protein interactions from published experiments.',
  },
  {
    q: 'How do I search for a protein?',
    a: 'Enter a gene name, UniProt ID, or Ensembl ID in the search bar on the home page.',
  },
  {
    q: 'What do the edge colors mean?',
    a: 'Edges are colored by evidence type: Published (blue), Validated (green), Verified (purple), Literature (red), Mixed (pink).',
  },
  {
    q: 'How do I download interaction data?',
    a: 'After searching, use the Download button in the toolbar. You must be logged in to download.',
  },
  {
    q: 'What file formats are available for download?',
    a: 'SIF, CSV (interactions), CSV (interactors), FASTA (sequences), and PSI-MI MITAB 2.5.',
  },
  {
    q: 'How do I cite this database?',
    a: 'Please cite: Helmy et al., Journal of Molecular Biology, 2022.',
  },
]

export function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--color-main)' }}>
        Frequently Asked Questions
      </h1>
      <dl className="space-y-6">
        {FAQS.map(({ q, a }) => (
          <div key={q} className="border-b border-gray-100 pb-6">
            <dt className="font-semibold text-gray-900 mb-2">{q}</dt>
            <dd className="text-gray-600 leading-relaxed">{a}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
