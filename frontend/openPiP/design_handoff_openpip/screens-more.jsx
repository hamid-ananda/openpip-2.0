/* global React, OpWordmark, OpNav, NetworkGraph, BAD_NETWORK */

// =====================================================================
// PROTEIN DETAIL — deep dive for a single gene/protein
// =====================================================================
function ProteinDetailScreen({ density = 'comfortable' }) {
  return (
    <div style={{ width: 1440, background: 'var(--bg)', minHeight: 1100 }}>
      <window.OpNav active="Search" density={density}/>

      {/* Breadcrumb */}
      <div style={{ padding: '20px 80px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
        <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Search</a>
        <span>›</span>
        <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Human interactome</a>
        <span>›</span>
        <span style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>BAD</span>
      </div>

      {/* Header */}
      <section style={{ padding: '24px 80px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span className="op-chip primary">Protein record</span>
              <span className="op-chip">UniProt · reviewed</span>
              <span className="op-chip dot" style={{ color: 'var(--success)' }}>Verified</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 8 }}>
              <h1 style={{ fontSize: 56, fontWeight: 600, letterSpacing: '-.03em', margin: 0, fontFamily: 'var(--mono)' }}>BAD</h1>
              <span style={{ fontSize: 18, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>Q92934</span>
            </div>
            <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 4px', maxWidth: 720 }}>
              BCL2-associated agonist of cell death — a pro-apoptotic member of the BCL-2 family. Displaces BAX from BCL-XL and BCL-2; phosphorylation by AKT1 sequesters BAD in 14-3-3 complexes.
            </p>
            <div style={{ fontSize: 13, color: 'var(--text-soft)', fontFamily: 'var(--mono)' }}>Chr 11p15.1 · 168 aa · 18,392 Da</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="op-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>
              Save
            </button>
            <button className="op-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4M12 2v13"/></svg>
              Share
            </button>
            <button className="op-btn primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3v13m-5-5 5 5 5-5M5 21h14"/></svg>
              Export
            </button>
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 28, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', overflow: 'hidden' }}>
          {[
            ['16', 'Interactors', 'In current view'],
            ['24', 'Interactions', 'Across 3 datasets'],
            ['0.83', 'Avg. confidence', 'Where scored'],
            ['8', 'Tissues', 'High expression'],
          ].map(([n,l,sub], i) => (
            <div key={i} style={{ padding: '20px 24px', borderLeft: i ? '1px solid var(--border)' : 'none' }}>
              <div className="op-num" style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em' }}>{n}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{l}</div>
              <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div style={{ padding: '0 80px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            ['Interactions', true],
            ['Sequence', false],
            ['Expression', false],
            ['Domains', false],
            ['Literature', false],
          ].map(([t, active]) => (
            <a key={t} href="#" style={{
              padding: '12px 16px', fontSize: 13, fontWeight: 500, textDecoration: 'none',
              color: active ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
            }}>{t}</a>
          ))}
        </div>
      </div>

      {/* Body: network + side panels */}
      <section style={{ padding: '32px 80px 32px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
        <div className="op-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Interactome neighborhood</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="op-btn" style={{ padding: '4px 10px', fontSize: 11 }}>Depth 1</button>
              <button className="op-btn" style={{ padding: '4px 10px', fontSize: 11, opacity: .55 }}>Depth 2</button>
            </div>
          </div>
          <NetworkGraph height={420}/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="op-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Function (GO biological process)</div>
            {[
              ['apoptotic process', 'GO:0006915'],
              ['regulation of mitochondrial membrane permeability', 'GO:0046902'],
              ['response to growth factor', 'GO:0070848'],
            ].map(([t, id]) => (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span>{t}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-soft)' }}>{id}</span>
              </div>
            ))}
          </div>

          <div className="op-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Tissue expression</div>
            {[
              ['Heart, left ventricle', 92],
              ['Brain, cerebellum', 78],
              ['Liver', 64],
              ['Kidney cortex', 51],
              ['Adipose subcutaneous', 28],
            ].map(([t, v]) => (
              <div key={t} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 40px', gap: 12, padding: '6px 0', alignItems: 'center', fontSize: 12 }}>
                <span>{t}</span>
                <span style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', inset: 0, width: `${v}%`, background: 'var(--primary)', borderRadius: 3 }}/>
                </span>
                <span className="op-num" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="op-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Cross references</div>
            {[
              ['UniProt', 'Q92934'],
              ['HGNC', '936'],
              ['Ensembl', 'ENSG00000002330'],
              ['RefSeq', 'NM_004322.3'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <a href="#" style={{ fontFamily: 'var(--mono)', color: 'var(--primary)', textDecoration: 'none' }}>{v}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactions table */}
      <section style={{ padding: '0 80px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px' }}>All interactions</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>24 interactions across 3 datasets · sorted by score</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="op-input" placeholder="Filter…" style={{ width: 200, padding: '6px 10px', fontSize: 12 }}/>
            <button className="op-btn" style={{ padding: '6px 12px', fontSize: 12 }}>Columns ▾</button>
          </div>
        </div>
        <div className="op-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr .8fr 1fr 80px', padding: '12px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            <div>Partner</div><div>Score</div><div>Method</div><div>Dataset</div><div></div>
          </div>
          {[
            ['BCL2L2', 'BCL2-like protein 2', 0.879, 'Y2H', 'Lit-BM · HI-III'],
            ['KRT31', 'Keratin, type I cuticular Ha1', 0.891, 'AP-MS', 'HI-III'],
            ['ACTN2', 'Alpha-actinin-2', 0.819, 'Y2H', 'HI-III'],
            ['BCL2L1', 'Bcl-2-like protein 1', 0.834, 'Y2H', 'HuRI · Lit-BM'],
            ['YWHAE', '14-3-3 protein epsilon', null, 'Lit-curated', 'Lit-BM'],
            ['YWHAH', '14-3-3 protein eta', null, 'Lit-curated', 'Lit-BM'],
            ['AKT1', 'RAC-alpha serine/threonine-protein kinase', null, 'Lit-curated', 'Lit-BM'],
            ['RAF1', 'RAF proto-oncogene serine/threonine kinase', null, 'Lit-curated', 'Lit-BM'],
          ].map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr .8fr 1fr 80px', padding: '12px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--primary)' }}>{r[0]}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r[1]}</div>
              </div>
              <div className="op-num">{r[2] ?? <span style={{ color: 'var(--text-soft)' }}>—</span>}</div>
              <div style={{ color: 'var(--text-muted)' }}>{r[3]}</div>
              <div>
                {r[4].split(' · ').map(d => (
                  <span key={d} className="op-chip" style={{ marginRight: 4, fontSize: 10 }}>{d}</span>
                ))}
              </div>
              <div style={{ textAlign: 'right' }}>
                <button className="op-btn" style={{ padding: '4px 10px', fontSize: 11 }}>View →</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// =====================================================================
// DOCS / API — programmatic access
// =====================================================================
function DocsScreen({ density = 'comfortable' }) {
  const sections = [
    { id: 'getting-started', label: 'Getting started', items: ['Overview', 'Authentication', 'Rate limits'] },
    { id: 'reference', label: 'API reference', items: ['Search', 'Proteins', 'Interactions', 'Datasets'] },
    { id: 'sdk', label: 'SDKs', items: ['Python', 'R', 'Command line'] },
    { id: 'guides', label: 'Guides', items: ['Walk a neighborhood', 'Bulk export', 'Cite a dataset'] },
  ];
  return (
    <div style={{ width: 1440, background: 'var(--bg)', minHeight: 1100 }}>
      <window.OpNav active="" density={density}/>

      <section style={{ padding: '40px 80px 0', display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: 48 }}>
        {/* Left nav */}
        <aside style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
          <div className="op-chip primary" style={{ marginBottom: 16 }}>v3 · stable</div>
          <input className="op-input" placeholder="Search docs…" style={{ marginBottom: 20, padding: '8px 12px', fontSize: 12 }}/>
          {sections.map(s => (
            <div key={s.id} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>{s.label}</div>
              {s.items.map((it, i) => (
                <a key={it} href="#" style={{
                  display: 'block', padding: '5px 10px', borderRadius: 6, fontSize: 13,
                  color: s.id==='reference' && i===0 ? 'var(--primary)' : 'var(--text-muted)',
                  background: s.id==='reference' && i===0 ? 'var(--primary-soft)' : 'transparent',
                  textDecoration: 'none', marginLeft: -10,
                }}>{it}</a>
              ))}
            </div>
          ))}
        </aside>

        {/* Article */}
        <article style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            <span>API reference</span><span>›</span><span style={{ color: 'var(--text)' }}>Search</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-.025em', margin: '0 0 12px' }}>Search the interactome</h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 28px', maxWidth: 640 }}>
            Query interactions by gene symbol, UniProt accession, or HGNC id. Returns a JSON document containing the neighborhood subgraph with full provenance.
          </p>

          {/* Endpoint card */}
          <div className="op-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ padding: '3px 10px', borderRadius: 5, background: 'var(--success)', color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)', letterSpacing: '.05em' }}>GET</span>
              <code style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text)' }}>/api/v3/search</code>
              <span style={{ flex: 1 }}/>
              <button className="op-btn" style={{ padding: '4px 10px', fontSize: 11 }}>Try it →</button>
            </div>
            <div style={{ padding: '18px 20px', fontSize: 13 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Query parameters</div>
              {[
                ['gene', 'string', 'Required. Gene symbol, e.g. BAD'],
                ['depth', 'integer', 'Neighborhood depth, 1–3. Default 1'],
                ['min_score', 'float', 'Minimum confidence, 0–1. Default 0'],
                ['datasets', 'string[]', 'Comma-separated. Default all'],
              ].map(([p, t, d]) => (
                <div key={p} style={{ display: 'grid', gridTemplateColumns: '160px 100px 1fr', gap: 16, padding: '8px 0', borderTop: '1px solid var(--border)', alignItems: 'baseline' }}>
                  <code style={{ fontFamily: 'var(--mono)', color: 'var(--primary)' }}>{p}</code>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-soft)' }}>{t}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Example */}
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 12px' }}>Example request</h2>
          <CodeBlock
            lang="bash"
            code={`curl https://openpip.org/api/v3/search \\
  -H "Authorization: Bearer $OPENPIP_KEY" \\
  -G --data-urlencode "gene=BAD" \\
     --data-urlencode "depth=1" \\
     --data-urlencode "min_score=0.4"`}
          />

          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '32px 0 12px' }}>Example response</h2>
          <CodeBlock
            lang="json"
            code={`{
  "query": "BAD",
  "uniprot": "Q92934",
  "nodes": 16,
  "edges": 24,
  "interactions": [
    { "a": "BAD", "b": "BCL2L2", "score": 0.879,
      "dataset": ["Lit-BM", "HI-III"], "method": "Y2H" },
    { "a": "BAD", "b": "KRT31",  "score": 0.891,
      "dataset": ["HI-III"], "method": "AP-MS" }
  ]
}`}
          />
        </article>

        {/* Right rail — on this page */}
        <aside style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>On this page</div>
          {[
            ['Overview', true],
            ['Query parameters', false],
            ['Example request', false],
            ['Example response', false],
            ['Errors', false],
            ['Pagination', false],
          ].map(([t, a]) => (
            <a key={t} href="#" style={{
              display: 'block', padding: '4px 10px', fontSize: 12,
              color: a ? 'var(--primary)' : 'var(--text-muted)',
              borderLeft: `2px solid ${a ? 'var(--primary)' : 'transparent'}`,
              textDecoration: 'none', marginLeft: -10,
            }}>{t}</a>
          ))}
          <div style={{ marginTop: 28, padding: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Need a key?</div>
            <div style={{ color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 10 }}>Free for academic and non-commercial use. Sign in and request one from your account page.</div>
            <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Request a key →</a>
          </div>
        </aside>
      </section>
    </div>
  );
}

function CodeBlock({ code, lang }) {
  return (
    <div className="op-card" style={{ padding: 0, overflow: 'hidden', background: 'var(--surface-2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
        <span>{lang}</span>
        <span style={{ cursor: 'pointer' }}>Copy</span>
      </div>
      <pre style={{ margin: 0, padding: '16px 20px', fontFamily: 'var(--mono)', fontSize: 12.5, lineHeight: 1.65, color: 'var(--text)', overflow: 'auto' }}>{code}</pre>
    </div>
  );
}

// =====================================================================
// REGISTER — create an account
// =====================================================================
function RegisterScreen({ density = 'comfortable' }) {
  return (
    <div style={{ width: 1440, height: 900, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <window.OpNav active="" density={density}/>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {/* Form side */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64, overflow: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <window.OpWordmark size={20}/>
            <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em', margin: '32px 0 6px' }}>Create your account</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px' }}>Free for academic and non-commercial use.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>First name</label>
                <input className="op-input" style={{ marginTop: 6 }}/>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Last name</label>
                <input className="op-input" style={{ marginTop: 6 }}/>
              </div>
            </div>

            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Institutional email</label>
            <input className="op-input" placeholder="you@university.edu" style={{ margin: '6px 0 14px' }}/>

            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Affiliation</label>
            <input className="op-input" placeholder="Lab, department, university" style={{ margin: '6px 0 14px' }}/>

            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Password</label>
            <input type="password" className="op-input" style={{ margin: '6px 0 6px' }}/>
            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
              {[1,2,3,4].map(i => (
                <span key={i} style={{ flex: 1, height: 3, background: i <= 3 ? 'var(--success)' : 'var(--border)', borderRadius: 2 }}/>
              ))}
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 18 }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', marginTop: 2 }}/>
              <span>I agree to the <a href="#" style={{ color: 'var(--primary)' }}>terms of use</a> and the publication moratorium on preliminary CCSB data.</span>
            </label>

            <button className="op-btn primary" style={{ width: '100%', padding: '11px', justifyContent: 'center', fontSize: 14 }}>Create account</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: 'var(--text-soft)', fontSize: 11 }}>
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }}/>OR<span style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            </div>
            <button className="op-btn" style={{ width: '100%', padding: '10px', justifyContent: 'center' }}>Continue with ORCID</button>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
              Already have an account? <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Sign in</a>
            </div>
          </div>
        </div>

        {/* Benefits side */}
        <div style={{ background: 'var(--surface-2)', borderLeft: '1px solid var(--border)', padding: '64px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ maxWidth: 440 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>What you unlock</div>
            <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-.02em', margin: '0 0 32px', lineHeight: 1.15 }}>One key for the whole interactome.</h2>
            {[
              ['Bulk downloads', 'Pull every dataset in PSI-MI tab, SIF, CSV, or FASTA.'],
              ['API access', 'A personal key for the v3 search and protein endpoints.'],
              ['Saved queries', 'Bookmark gene neighborhoods, share them with collaborators.'],
              ['Update digests', 'Get notified when a dataset you cite is revised.'],
            ].map(([t, d], i) => (
              <div key={t} style={{ display: 'flex', gap: 14, padding: '14px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{t}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProteinDetailScreen, DocsScreen, RegisterScreen });
