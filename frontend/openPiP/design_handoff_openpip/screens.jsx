/* global React, OpLogo, OpWordmark, NetworkGraph, OpNav, BAD_NETWORK */
const { useState: useS } = React;

// ==========================================================================
// HOME — dashboard reframe
// ==========================================================================
function HomeScreen({ density = 'comfortable' }) {
  return (
    <div style={{ width: 1440, background: 'var(--bg)', minHeight: 900 }}>
      <OpNav active="Home" density={density}/>
      {/* Hero */}
      <section style={{ padding: '64px 80px 40px', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div className="op-chip primary" style={{ marginBottom: 20 }}>● Open-source protein interaction platform</div>
          <h1 style={{ fontSize: 56, lineHeight: 1.05, letterSpacing: '-.03em', margin: '0 0 20px', fontWeight: 600 }}>
            The protein <span style={{ color: 'var(--primary)' }}>interaction graph</span>,<br/>made queryable.
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 32px', maxWidth: 540 }}>
            Search 11,600 proteins across 76,563 verified interactions from the CCSB Human Interactome — visualized, filterable, and ready to export.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
            <button className="op-btn primary" style={{ padding: '12px 20px', fontSize: 14 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              Start a search
            </button>
            <button className="op-btn" style={{ padding: '12px 20px', fontSize: 14 }}>Browse datasets →</button>
          </div>
          <div style={{ display: 'flex', gap: 48 }}>
            <Stat n="11,600" l="Proteins indexed"/>
            <Stat n="76,563" l="Verified interactions"/>
            <Stat n="6" l="Source datasets"/>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div className="op-card" style={{ padding: 24, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ fontFamily: 'var(--mono)' }}>BAD · interactome</span>
              <span className="op-chip dot" style={{ color: 'var(--success)' }}>live</span>
            </div>
            <NetworkGraph height={420}/>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section style={{ padding: '40px 80px 80px' }}>
        <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 20px' }}>Three ways to start</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <ActionCard icon="search" title="Search by gene" desc="Enter a UniProt or HGNC identifier — find every protein it touches." accent="var(--primary)"/>
          <ActionCard icon="info" title="Browse the atlas" desc="Pre-built views into HI-III, Lit-BM, HuRI and the literature." accent="var(--accent)"/>
          <ActionCard icon="download" title="Bulk download" desc="PSI-MI tab, SIF, CSV, FASTA — pick your format and pull the lot." accent="var(--accent-2)"/>
        </div>
      </section>

      {/* News + footer band */}
      <section style={{ padding: '32px 80px 80px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
        <div className="op-card" style={{ padding: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>News</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-soft)', minWidth: 70 }}>2025·09·22</span>
            <div>
              <a href="#" style={{ color: 'var(--text)', fontWeight: 500, textDecoration: 'none', fontSize: 14 }}>openPIP has moved to a new server</a>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Now hosted at the University of Saskatchewan, maintained by the Helmy Lab at VIDO.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-soft)', minWidth: 70 }}>2025·07·14</span>
            <div>
              <a href="#" style={{ color: 'var(--text)', fontWeight: 500, textDecoration: 'none', fontSize: 14 }}>HI-III dataset expanded with 48,070 interactions</a>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Latest release of the systematic binary screen, now searchable.</div>
            </div>
          </div>
        </div>
        <div className="op-card" style={{ padding: 28, background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)', color: '#fff', border: 'none' }}>
          <div style={{ fontSize: 11, fontWeight: 500, opacity: .8, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Cite openPIP</div>
          <div style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 20 }}>If openPIP supports your research, please cite the platform and the underlying source datasets.</div>
          <button className="op-btn" style={{ background: 'rgba(255,255,255,.16)', color: '#fff', borderColor: 'rgba(255,255,255,.25)' }}>Copy BibTeX</button>
        </div>
      </section>
    </div>
  );
}
function Stat({ n, l }) {
  return (
    <div>
      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em' }} className="op-num">{n}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{l}</div>
    </div>
  );
}
function ActionCard({ icon, title, desc, accent }) {
  const icons = {
    search: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
    info: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>,
    download: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v13m-5-5 5 5 5-5M5 21h14"/></svg>,
  };
  return (
    <div className="op-card" style={{ padding: 24, cursor: 'pointer', transition: 'all .15s' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `color-mix(in oklab, ${accent} 14%, transparent)`, color: accent, display: 'grid', placeItems: 'center', marginBottom: 16 }}>{icons[icon]}</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

// ==========================================================================
// SEARCH/NETWORK — the main tool, dashboard reframe
// ==========================================================================
function SearchScreen({ density = 'comfortable', nodeStyle = 'filled', layout = 'panel-right' }) {
  const [query, setQuery] = useS('BAD');
  const [filter, setFilter] = useS({ score: 0, hiUnion: true, literature: true });
  const [selectedNode, setSelectedNode] = useS(null);
  const rowH = density === 'compact' ? 32 : 40;
  const sidebarFirst = layout === 'panel-left';

  const sidebar = (
    <aside style={{ width: 320, background: 'var(--surface)', borderRight: sidebarFirst ? '1px solid var(--border)' : 'none', borderLeft: sidebarFirst ? 'none' : '1px solid var(--border)', padding: 20, overflow: 'auto' }}>
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Query</label>
        <div style={{ position: 'relative', marginTop: 8 }}>
          <input className="op-input" value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 34, fontFamily: 'var(--mono)' }}/>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: 12, top: 12 }}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {['BAD', 'TP53', 'BRCA1', 'AKT1'].map(g => (
            <button key={g} onClick={() => setQuery(g)} className="op-chip" style={{ cursor: 'pointer', fontFamily: 'var(--mono)', background: query===g ? 'var(--primary-soft)' : undefined, color: query===g ? 'var(--primary-deep)' : undefined }}>{g}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Minimum confidence score</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <input type="range" min="0" max="1" step="0.05" value={filter.score} onChange={e => setFilter({ ...filter, score: parseFloat(e.target.value) })} style={{ flex: 1, accentColor: 'var(--primary)' }}/>
          <span className="op-num" style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 32 }}>{filter.score.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Interaction sources</label>
        <div style={{ marginTop: 10 }}>
          <ToggleRow label="HI-Union" color="var(--hi-union)" v={filter.hiUnion} onChange={v => setFilter({ ...filter, hiUnion: v })}/>
          <ToggleRow label="Literature" color="var(--literature)" v={filter.literature} onChange={v => setFilter({ ...filter, literature: v })}/>
          <ToggleRow label="HuRI + Literature" color="var(--huri-lit)" v={true} onChange={() => {}}/>
        </div>
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Tissue expression</label>
        <select className="op-input" style={{ marginTop: 8 }} defaultValue="">
          <option value="">All tissues</option>
          <option>Adipose Subcutaneous</option><option>Adrenal Gland</option><option>Artery Aorta</option>
          <option>Brain basal ganglia</option><option>Brain cerebellum</option>
        </select>
      </div>
    </aside>
  );

  const main = (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, letterSpacing: '-.01em' }}>{query} interactome</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· 16 interactors · 24 interactions</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <LayoutBtn icon="∗"/>
          <LayoutBtn icon="○" active/>
          <LayoutBtn icon="▦"/>
          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }}/>
          <button className="op-btn" style={{ padding: '6px 10px', fontSize: 12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v13m-5-5 5 5 5-5"/></svg>
            Export
          </button>
        </div>
      </div>

      {/* Graph */}
      <div style={{ flex: 1, position: 'relative', background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)', minHeight: 480 }}>
        <NetworkGraph height={520} nodeStyle={nodeStyle} density={density}/>
        {/* Floating legend */}
        <div style={{ position: 'absolute', top: 16, right: 16, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-sm)', fontSize: 11 }}>
          <LegendRow label="Query" color="var(--query)" type="node"/>
          <LegendRow label="Interactor" color="var(--interactor)" type="node"/>
          <div style={{ height: 6 }}/>
          <LegendRow label="HI-Union" color="var(--hi-union)" type="line"/>
          <LegendRow label="Literature" color="var(--literature)" type="line"/>
          <LegendRow label="HuRI + Lit" color="var(--huri-lit)" type="line"/>
        </div>
        {/* Zoom controls */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          {['+','−','⤢'].map((s,i) => (
            <button key={i} style={{ border: 'none', background: 'transparent', padding: '8px 10px', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', borderTop: i ? '1px solid var(--border)' : 'none' }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Interactions table */}
      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Interactions</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>16 results</span>
          </div>
          <input className="op-input" placeholder="Filter interactors…" style={{ width: 220, padding: '6px 10px', fontSize: 12 }}/>
        </div>
        <div style={{ maxHeight: 200, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                {['Interactor A', 'Interactor B', 'Score', 'Dataset'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 24px', fontWeight: 500, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['BAD','ACTN2','0.819','HI-III'],['BAD','KRT31','0.891','HI-III'],
                ['BAD','YWHAE','—','Lit-BM'],['BAD','YWHAH','—','Lit-BM'],
                ['BAD','BCL2L2','0.879','Lit-BM · Test-Space · HI-III'],
                ['BAD','RAF1','—','Lit-BM'],['BAD','YWHAQ','—','Lit-BM'],
              ].map((r,i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', height: rowH, cursor: 'pointer' }}>
                  <td style={{ padding: '0 24px', color: 'var(--query)', fontFamily: 'var(--mono)', fontWeight: 500 }}>{r[0]}</td>
                  <td style={{ padding: '0 24px', color: 'var(--primary)', fontFamily: 'var(--mono)', fontWeight: 500 }}>{r[1]}</td>
                  <td style={{ padding: '0 24px', fontFamily: 'var(--mono)' }} className="op-num">{r[2]}</td>
                  <td style={{ padding: '0 24px', color: 'var(--text-muted)' }}>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );

  return (
    <div style={{ width: 1440, background: 'var(--bg)', display: 'flex', flexDirection: 'column', height: 980 }}>
      <OpNav active="Search" density={density}/>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {sidebarFirst ? <>{sidebar}{main}</> : <>{main}{sidebar}</>}
      </div>
    </div>
  );
}
function ToggleRow({ label, color, v, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', cursor: 'pointer', fontSize: 13 }}>
      <input type="checkbox" checked={v} onChange={e => onChange(e.target.checked)} style={{ accentColor: 'var(--primary)' }}/>
      <span style={{ width: 12, height: 3, background: color, borderRadius: 2 }}/>
      <span>{label}</span>
    </label>
  );
}
function LegendRow({ label, color, type }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
      {type === 'node' ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }}/> : <span style={{ width: 14, height: 2, background: color, borderRadius: 1 }}/>}
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
function LayoutBtn({ icon, active }) {
  return (
    <button style={{ border: '1px solid var(--border)', background: active ? 'var(--primary-soft)' : 'var(--surface)', color: active ? 'var(--primary-deep)' : 'var(--text-muted)', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 13 }}>{icon}</button>
  );
}

// ==========================================================================
// DOWNLOADS
// ==========================================================================
function DownloadsScreen({ density = 'comfortable' }) {
  const datasets = [
    { name: 'HI-III', count: 48070, pub: '—', kind: 'screen', note: 'Latest systematic binary screen' },
    { name: 'HI-II-14', count: 14921, pub: '25416956', kind: 'screen', note: 'Rolland et al., Cell 2014' },
    { name: 'HI-I-05', count: 2858, pub: '16189514', kind: 'screen', note: 'Rual et al., Nature 2005' },
    { name: 'Yu-11', count: 2449, pub: '21516116', kind: 'screen', note: 'Yu et al., Nat Methods 2011' },
    { name: 'Yang-16', count: 871, pub: '26871637', kind: 'screen', note: 'Yang et al., Cell 2016' },
    { name: 'Venkatesan-09', count: 197, pub: '19060904', kind: 'screen', note: 'Venkatesan et al., Nat Methods 2009' },
    { name: 'Lit-BM', count: 13441, pub: '—', kind: 'literature', note: 'Binary literature-curated set' },
    { name: 'Test-Space', count: 11000, pub: '—', kind: 'screen', note: 'Search-space reference' },
  ];
  return (
    <div style={{ width: 1440, background: 'var(--bg)', minHeight: 900 }}>
      <OpNav active="Downloads" density={density}/>
      <section style={{ padding: '48px 80px 24px' }}>
        <div className="op-chip primary" style={{ marginBottom: 16 }}>Bulk data</div>
        <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: '-.025em', margin: '0 0 12px' }}>Downloads</h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, maxWidth: 680 }}>Every dataset hosted on openPIP, available as PSI-MI tab, SIF, CSV, or FASTA. Registered users may download verified and validated sets.</p>
      </section>

      {/* Moratorium notice */}
      <section style={{ padding: '0 80px 32px' }}>
        <div className="op-card" style={{ padding: 20, borderLeft: '3px solid var(--warn)', display: 'flex', gap: 16 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}><path d="M12 9v4m0 4h.01M10.3 3.86l-8.6 14.91A2 2 0 0 0 3.4 22h17.2a2 2 0 0 0 1.7-3.23L13.7 3.86a2 2 0 0 0-3.4 0Z"/></svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Publication moratorium</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>Preliminary, unpublished CCSB Human Interactome data has a 12-month moratorium on global analysis. Small-scale use (up to 10 interactions) is permitted. <a href="#" style={{ color: 'var(--primary)' }}>Read full guidelines →</a></div>
          </div>
        </div>
      </section>

      {/* Dataset table */}
      <section style={{ padding: '0 80px 64px' }}>
        <div className="op-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 220px', padding: '14px 24px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            <div>Dataset</div><div>Interactions</div><div>Publication</div><div style={{ textAlign: 'right' }}>Download</div>
          </div>
          {datasets.map(d => (
            <div key={d.name} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 220px', padding: '16px 24px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 500, fontSize: 14 }}>{d.name}</span>
                  <span className="op-chip" style={{ fontSize: 10 }}>{d.kind === 'screen' ? 'Screen' : 'Literature'}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.note}</div>
              </div>
              <div className="op-num" style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>{d.count.toLocaleString()}</div>
              <div>{d.pub === '—' ? <span style={{ color: 'var(--text-soft)' }}>—</span> : <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 13 }}>PMID:{d.pub}</a>}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                {['tab','sif','csv'].map(f => (
                  <button key={f} className="op-btn" style={{ padding: '5px 10px', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>.{f}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ==========================================================================
// ABOUT / FAQ / CONTACT
// ==========================================================================
function AboutScreen({ density = 'comfortable' }) {
  return (
    <div style={{ width: 1440, background: 'var(--bg)', minHeight: 900 }}>
      <OpNav active="About" density={density}/>
      <section style={{ padding: '64px 80px 32px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 64 }}>
        <aside style={{ position: 'sticky', top: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Contents</div>
          {['About openPIP', 'Source datasets', 'Team & funding', 'FAQ', 'Contact'].map((s,i) => (
            <a key={s} href="#" style={{ display: 'block', padding: '7px 0', fontSize: 13, color: i===0 ? 'var(--primary)' : 'var(--text-muted)', textDecoration: 'none', fontWeight: i===0 ? 500 : 400 }}>{s}</a>
          ))}
        </aside>
        <article style={{ maxWidth: 720 }}>
          <h1 style={{ fontSize: 42, fontWeight: 600, letterSpacing: '-.025em', margin: '0 0 8px' }}>About openPIP</h1>
          <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 32px' }}>The Open-Source Protein Interaction Platform is software for hosting protein-protein interaction data in PSI-MI-TAB format.</p>

          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '32px 0 12px' }}>What it does</h2>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text)', margin: '0 0 16px' }}>openPIP wraps a PPI database with a customizable web interface that handles searching, visualizing, and downloading interaction results across formats. The platform ships as a virtual machine, ready to import into VMware.</p>

          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '32px 0 16px' }}>Frequently asked</h2>
          {[
            ['What is a PPI?', 'A protein-protein interaction (PPI) is a physical contact between two or more proteins, often functionally meaningful.'],
            ['How do I cite openPIP?', 'Cite the platform and the underlying source datasets used in your analysis. BibTeX is on the home page.'],
            ['Can I host my own openPIP?', 'Yes — the platform is open source. The downloads page links the VM image and the source repository.'],
          ].map(([q,a]) => (
            <details key={q} style={{ borderTop: '1px solid var(--border)', padding: '16px 0' }}>
              <summary style={{ fontSize: 15, fontWeight: 500, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between' }}>
                {q}<span style={{ color: 'var(--text-muted)' }}>+</span>
              </summary>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '10px 0 0' }}>{a}</p>
            </details>
          ))}

          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '32px 0 12px' }}>Contact</h2>
          <div className="op-card" style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Maintainer</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Helmy Lab, VIDO</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>University of Saskatchewan</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Original development</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Bader Lab</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>The Donnelly Centre, University of Toronto</div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

// ==========================================================================
// LOGIN
// ==========================================================================
function LoginScreen({ density = 'comfortable' }) {
  return (
    <div style={{ width: 1440, height: 900, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <OpNav active="" density={density}/>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <OpWordmark size={20}/>
            <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em', margin: '32px 0 6px' }}>Sign in</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px' }}>Access verified datasets and bulk downloads.</p>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Username</label>
            <input className="op-input" defaultValue="admin" style={{ margin: '6px 0 16px' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Password</label>
              <a href="#" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}>Forgot?</a>
            </div>
            <input type="password" className="op-input" style={{ margin: '6px 0 20px' }}/>
            <button className="op-btn primary" style={{ width: '100%', padding: '11px', justifyContent: 'center', fontSize: 14 }}>Sign in</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: 'var(--text-soft)', fontSize: 11 }}>
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }}/>OR<span style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            </div>
            <button className="op-btn" style={{ width: '100%', padding: '10px', justifyContent: 'center' }}>Continue with ORCID</button>
            <div style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: 'var(--text-muted)' }}>
              New to openPIP? <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Create an account</a>
            </div>
          </div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <NetworkGraph height={500} interactive={false} showLabels={false} nodeStyle="outlined"/>
          <div style={{ position: 'absolute', bottom: 48, left: 48, right: 48, color: '#fff' }}>
            <div style={{ fontSize: 12, fontWeight: 500, opacity: .8, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>76,563 interactions, one query away</div>
            <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.3, letterSpacing: '-.01em', maxWidth: 480 }}>"openPIP is the fastest way to walk a neighborhood of the human interactome."</div>
            <div style={{ fontSize: 13, opacity: .75, marginTop: 12 }}>— Helmy Lab, VIDO</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, SearchScreen, DownloadsScreen, AboutScreen, LoginScreen });
