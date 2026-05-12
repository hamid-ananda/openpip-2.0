/* global React */
const { useState, useEffect, useRef, useMemo } = React;

// =====================================================================
// LOGO — modernized openPIP mark (interaction network glyph)
// =====================================================================
function OpLogo({ size = 26, variant = 'dark' }) {
  const color = variant === 'light' ? '#fff' : '#0b1220';
  const accent = variant === 'light' ? '#7dd3fc' : '#2563eb';
  const red = '#e11d48';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="4" fill={red}/>
      <circle cx="5" cy="8" r="2.2" fill={accent}/>
      <circle cx="27" cy="9" r="2.2" fill={accent}/>
      <circle cx="6" cy="25" r="2.2" fill={accent}/>
      <circle cx="26" cy="25" r="2.2" fill={accent}/>
      <path d="M16 16 L5 8 M16 16 L27 9 M16 16 L6 25 M16 16 L26 25" stroke={color} strokeWidth="1" strokeLinecap="round" opacity=".5"/>
    </svg>
  );
}

function OpWordmark({ variant = 'dark', size = 18 }) {
  const color = variant === 'light' ? '#fff' : '#0b1220';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color, fontWeight: 600, letterSpacing: '-.015em', fontSize: size }}>
      <OpLogo size={size + 8} variant={variant}/>
      <span><span style={{ fontWeight: 400, opacity: .7 }}>open</span>PIP</span>
    </span>
  );
}

// =====================================================================
// NETWORK GRAPH — beautiful SVG visualization of the BAD interactome
// =====================================================================
const BAD_NETWORK = {
  query: 'BAD',
  nodes: [
    { id: 'BAD', x: 0, y: 0, kind: 'query' },
    { id: 'YWHAB', x: 0, y: -200, kind: 'interactor' },
    { id: 'YWHAE', x: 110, y: -150, kind: 'interactor' },
    { id: 'BCL2', x: 200, y: -100, kind: 'interactor' },
    { id: 'YWHAZ', x: 170, y: -50, kind: 'interactor' },
    { id: 'BCL2L1', x: 220, y: 30, kind: 'interactor' },
    { id: 'YWHAH', x: 250, y: 80, kind: 'interactor' },
    { id: 'RAF1', x: 90, y: -60, kind: 'interactor' },
    { id: 'YWHAG', x: 180, y: 160, kind: 'interactor' },
    { id: 'AKT1', x: 30, y: 220, kind: 'interactor' },
    { id: 'SFN', x: -40, y: 110, kind: 'interactor' },
    { id: 'ACTN2', x: -120, y: 130, kind: 'interactor' },
    { id: 'KRT31', x: -190, y: 180, kind: 'interactor' },
    { id: 'S100A10', x: -100, y: -10, kind: 'interactor' },
    { id: 'EWSR1', x: -170, y: 0, kind: 'interactor' },
    { id: 'BCL2L2', x: -240, y: -20, kind: 'interactor' },
    { id: 'BCL2L2-PABPN1', x: -160, y: -100, kind: 'interactor' },
  ],
  edges: [
    ['BAD','YWHAB','literature'], ['BAD','YWHAE','literature'], ['BAD','BCL2','literature'],
    ['BAD','YWHAZ','literature'], ['BAD','BCL2L1','huri-lit'], ['BAD','YWHAH','literature'],
    ['BAD','RAF1','literature'], ['BAD','YWHAG','literature'], ['BAD','AKT1','literature'],
    ['BAD','SFN','huri-lit'], ['BAD','ACTN2','hi-union'], ['BAD','KRT31','hi-union'],
    ['BAD','S100A10','literature'], ['BAD','EWSR1','huri-lit'], ['BAD','BCL2L2','huri-lit'],
    ['BAD','BCL2L2-PABPN1','literature'],
    ['RAF1','YWHAZ','literature'], ['RAF1','YWHAE','literature'], ['RAF1','YWHAH','literature'],
    ['BCL2','YWHAZ','literature'], ['BCL2','BCL2L1','literature'], ['YWHAE','YWHAZ','literature'],
    ['YWHAZ','BCL2L1','literature'], ['SFN','BCL2L2','huri-lit'],
  ],
};

const EDGE_COLOR = {
  'hi-union': 'var(--hi-union)',
  'literature': 'var(--literature)',
  'huri-lit': 'var(--huri-lit)',
};

function NetworkGraph({ data = BAD_NETWORK, nodeStyle = 'filled', density = 'comfortable', height = 520, interactive = true, showLabels = true }) {
  const [hover, setHover] = useState(null);
  const W = 720, H = height;
  const cx = W/2, cy = H/2;

  const nbrSet = useMemo(() => {
    if (!hover) return null;
    const s = new Set([hover]);
    data.edges.forEach(([a,b]) => { if (a===hover) s.add(b); if (b===hover) s.add(a); });
    return s;
  }, [hover, data]);

  const nodeR = density === 'compact' ? 18 : 24;
  const labelSize = density === 'compact' ? 10 : 11;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', background: 'transparent' }}>
      <defs>
        <radialGradient id="bg-grad" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="rgba(37,99,235,.04)"/>
          <stop offset="100%" stopColor="rgba(37,99,235,0)"/>
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#bg-grad)"/>
      {/* Edges */}
      <g>
        {data.edges.map(([a,b,kind], i) => {
          const na = data.nodes.find(n => n.id===a);
          const nb = data.nodes.find(n => n.id===b);
          if (!na || !nb) return null;
          const dim = nbrSet && !(nbrSet.has(a) && nbrSet.has(b));
          return (
            <line key={i}
              x1={cx+na.x} y1={cy+na.y} x2={cx+nb.x} y2={cy+nb.y}
              stroke={EDGE_COLOR[kind] || 'var(--accent)'}
              strokeWidth={kind==='huri-lit' ? 2.5 : 1.5}
              opacity={dim ? .08 : (kind==='huri-lit' ? .85 : .55)}
              style={{ transition: 'opacity .2s' }}
            />
          );
        })}
      </g>
      {/* Nodes */}
      <g>
        {data.nodes.map(n => {
          const dim = nbrSet && !nbrSet.has(n.id);
          const isQuery = n.kind === 'query';
          const fill = nodeStyle === 'outlined' ? '#fff'
                     : nodeStyle === 'minimal' ? (isQuery ? 'var(--query)' : 'var(--surface)')
                     : (isQuery ? 'var(--query)' : 'var(--interactor)');
          const stroke = isQuery ? 'var(--query)' : 'var(--interactor)';
          return (
            <g key={n.id}
              transform={`translate(${cx+n.x},${cy+n.y})`}
              style={{ cursor: interactive ? 'pointer' : 'default', opacity: dim ? .25 : 1, transition: 'opacity .2s' }}
              onMouseEnter={() => interactive && setHover(n.id)}
              onMouseLeave={() => interactive && setHover(null)}
            >
              <circle r={nodeR} fill={fill} stroke={stroke} strokeWidth={nodeStyle==='outlined' ? 2 : (nodeStyle==='minimal' ? 1 : 0)}/>
              {showLabels && (
                <text textAnchor="middle" dy=".35em" fontSize={labelSize}
                  fontFamily="var(--mono)" fontWeight="500"
                  fill={nodeStyle==='filled' ? '#fff' : (isQuery ? '#fff' : 'var(--text)')}>
                  {n.id}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// =====================================================================
// NAV — slim top bar
// =====================================================================
function OpNav({ active = 'Home', density = 'comfortable', variant = 'light' }) {
  const items = ['Home', 'Search', 'Downloads', 'About', 'FAQ', 'Contact'];
  const isLight = variant === 'light';
  const pad = density === 'compact' ? '10px 22px' : '14px 28px';
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: pad,
      background: isLight ? 'var(--surface)' : '#0b1220',
      borderBottom: isLight ? '1px solid var(--border)' : '1px solid #1a2436',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
        <OpWordmark variant={isLight ? 'dark' : 'light'} size={16}/>
        <div style={{ display: 'flex', gap: 4 }}>
          {items.map(it => (
            <a key={it} href="#" style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              color: it===active ? (isLight ? 'var(--primary)' : '#fff') : (isLight ? 'var(--text-muted)' : 'rgba(255,255,255,.6)'),
              background: it===active ? (isLight ? 'var(--primary-soft)' : 'rgba(37,99,235,.2)') : 'transparent',
              textDecoration: 'none',
            }}>{it}</a>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <a href="#" style={{ fontSize: 13, color: isLight ? 'var(--text-muted)' : 'rgba(255,255,255,.7)', textDecoration: 'none' }}>Sign in</a>
        <button className="op-btn primary" style={{ fontSize: 12, padding: '7px 12px' }}>Register</button>
      </div>
    </nav>
  );
}

Object.assign(window, { OpLogo, OpWordmark, NetworkGraph, OpNav, BAD_NETWORK, EDGE_COLOR });
