const BASE = 'https://openpip.usask.ca/v2'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-main)' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre
      className="rounded-lg p-4 text-sm overflow-x-auto mb-4"
      style={{ background: 'var(--color-surface, #f3f4f6)', color: 'var(--color-text, #111)' }}
    >
      <code>{children.trim()}</code>
    </pre>
  )
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded mr-2"
      style={{ background: color, color: '#fff' }}
    >
      {label}
    </span>
  )
}

function EndpointRow({ method, path, desc }: { method: string; path: string; desc: string }) {
  const colors: Record<string, string> = { GET: '#16a34a', POST: '#2563eb', DELETE: '#dc2626' }
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 text-sm">
      <Tag label={method} color={colors[method] ?? '#555'} />
      <code
        className="font-mono text-xs px-2 py-0.5 rounded w-72 shrink-0"
        style={{ background: 'var(--color-surface, #f3f4f6)' }}
      >
        {path}
      </code>
      <span className="text-gray-500">{desc}</span>
    </div>
  )
}

export function ApiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-main)' }}>
        API &amp; External Access
      </h1>
      <p className="text-gray-500 mb-8">
        openPIP is fully open, no API key required. Use deep links, the REST API, the Python SDK,
        or the PSICQUIC protocol.
      </p>

      {/* ── 1. Deep links ── */}
      <Section title="1. Deep links">
        <p className="text-gray-600 mb-3 text-sm">
          Link directly to a search or protein page from any website. No code needed.
        </p>
        <Code>{`
# Search by gene name or UniProt ID
${BASE}/search/BRCA1
${BASE}/search/BRCA1,TP53,MYC

# Protein detail page
${BASE}/protein/BRCA1
${BASE}/protein/P38398
${BASE}/protein/ENSG00000012048
        `}</Code>
        <p className="text-gray-500 text-sm">
          Example "View in openPIP" button:
        </p>
        <Code>{`<a href="${BASE}/protein/BRCA1">View BRCA1 in openPIP</a>`}</Code>
      </Section>

      {/* ── 2. REST API ── */}
      <Section title="2. REST API">
        <p className="text-gray-600 mb-4 text-sm">
          All read endpoints are public and CORS-enabled, callable from any browser or server.
          Interactive docs with a live try-it-out console:{' '}
          <a
            href={`${BASE}/api/docs/`}
            target="_blank"
            rel="noreferrer"
            className="underline"
            style={{ color: 'var(--color-main)' }}
          >
            {BASE}/api/docs/
          </a>
        </p>

        <h3 className="font-medium text-gray-800 mb-2 text-sm">Public endpoints</h3>
        <div className="mb-6">
          <EndpointRow method="GET" path="/api/search?q=BRCA1" desc="Search proteins by gene name, UniProt ID, or Ensembl ID. Comma-separate for multi-protein." />
          <EndpointRow method="GET" path="/api/proteins/{identifier}" desc="Full protein detail including description, identifiers, and interaction count." />
          <EndpointRow method="GET" path="/api/counts" desc="Total proteins, interactions, and datasets in the database." />
          <EndpointRow method="GET" path="/api/datasets" desc="List all published interaction datasets." />
          <EndpointRow method="GET" path="/api/datasets/{id}/download" desc="Download a dataset file (PSI-MI TAB format)." />
          <EndpointRow method="GET" path="/api/announcements" desc="Site announcements." />
        </div>

        <h3 className="font-medium text-gray-800 mb-2 text-sm">JavaScript (browser or Node)</h3>
        <Code>{`
// Search
const res = await fetch('${BASE}/api/search?q=BRCA1');
const data = await res.json();
data.all_proteins.forEach(p => console.log(p.protein_gene_name, p.protein_uniprot_id));

// Multi-protein search
const res = await fetch('${BASE}/api/search?q=BRCA1,TP53');
const shared = data.all_proteins.filter(p =>
  data.query_protein_id_array.includes(p.protein_id)
);

// Protein detail
const res = await fetch('${BASE}/api/proteins/BRCA1');
const protein = await res.json();
console.log(protein.protein_description);

// Database counts
const { proteins, interactions } = await (
  await fetch('${BASE}/api/counts')
).json();
        `}</Code>

        <h3 className="font-medium text-gray-800 mb-2 text-sm">Python (requests)</h3>
        <Code>{`
import requests

BASE = '${BASE}'

# Search
r = requests.get(f'{BASE}/api/search', params={'q': 'BRCA1'})
proteins = r.json()['all_proteins']
print(proteins[0]['protein_gene_name'])  # BRCA1

# Protein detail
r = requests.get(f'{BASE}/api/proteins/P38398')
print(r.json()['protein_description'][:80])
        `}</Code>

        <h3 className="font-medium text-gray-800 mb-2 text-sm">curl</h3>
        <Code>{`
curl '${BASE}/api/search?q=BRCA1' | python3 -m json.tool
curl '${BASE}/api/proteins/BRCA1'
curl '${BASE}/api/counts'
        `}</Code>
      </Section>

      {/* ── 3. Python SDK ── */}
      <Section title="3. Python SDK">
        <p className="text-gray-600 mb-3 text-sm">
          A typed Python SDK for use in scripts, Jupyter notebooks, and pipelines.
        </p>
        <Code>{`
pip install openpip        # coming to PyPI - for now: pip install -e cli/
        `}</Code>
        <Code>{`
from openpip import OpenPIP

client = OpenPIP()                                     # uses ${BASE} by default

# Search - returns list of Protein objects
proteins = client.search('BRCA1')
print(proteins[0].gene_name, proteins[0].uniprot_id)

# As a pandas DataFrame
df = client.search('BRCA1,TP53', as_dataframe=True)

# Interactions
interactions = client.interactions('BRCA1', as_dataframe=True)

# Export network image
client.export_network('BRCA1', 'brca1_network.png')

# PSICQUIC
tab = client.psicquic('BRCA1')                         # PSI-MI TAB 2.5
        `}</Code>
      </Section>

      {/* ── 4. PSICQUIC ── */}
      <Section title="4. PSICQUIC">
        <p className="text-gray-600 mb-3 text-sm">
          openPIP implements the{' '}
          <a
            href="https://psicquic.github.io/"
            target="_blank"
            rel="noreferrer"
            className="underline"
            style={{ color: 'var(--color-main)' }}
          >
            PSICQUIC standard
          </a>
          , the same protocol used by BioGRID, IntAct, and STRING. Any tool written for those
          databases works with openPIP using the same syntax.
        </p>
        <Code>{`
# Base URL
${BASE}/psicquic/rest/query

# Examples
curl '${BASE}/psicquic/rest/query?q=BRCA1&format=tab25'
curl '${BASE}/psicquic/rest/query?q=idA:P38398&format=json'
curl '${BASE}/psicquic/rest/query?q=taxidA:9606&maxResults=100&format=tab25'
        `}</Code>

        <h3 className="font-medium text-gray-800 mb-2 text-sm">MIQL query syntax</h3>
        <div className="text-sm">
          {[
            ['BRCA1', 'Any interaction involving BRCA1'],
            ['idA:P38398', 'Interactions where interactor A is P38398'],
            ['idB:P04637', 'Interactions where interactor B is P04637'],
            ['id:P38398', 'Either interactor is P38398'],
            ['taxidA:9606', 'Interactor A is Homo sapiens (NCBI taxon 9606)'],
            ['*', 'All interactions'],
          ].map(([q, desc]) => (
            <div key={q} className="flex gap-4 py-1.5 border-b border-gray-100">
              <code
                className="px-2 py-0.5 rounded text-xs w-44 shrink-0"
                style={{ background: 'var(--color-surface, #f3f4f6)' }}
              >
                {q}
              </code>
              <span className="text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 5. Cite ── */}
      <Section title="5. Citing openPIP">
        <p className="text-gray-600 text-sm">
          If you use openPIP in your research, please cite:
        </p>
        <Code>{`
Helmy M. et al. openPIP: an open-source human protein interaction
database and analysis platform. J. Mol. Biol. (2022).
https://doi.org/10.1016/j.jmb.2022.167481
        `}</Code>
      </Section>
    </div>
  )
}
