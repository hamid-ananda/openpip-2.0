export function LoadingOverlay() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,.55)',
    }}>
      <div style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.15)',
        borderTopColor: 'rgba(255,255,255,0.9)',
        animation: 'spin .8s linear infinite',
        marginBottom: 16,
      }} />
      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500, margin: 0 }}>
        Preparing network data for export.
      </p>
    </div>
  )
}
