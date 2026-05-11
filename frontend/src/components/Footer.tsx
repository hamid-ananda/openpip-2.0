interface FooterProps {
  html: string
}

export function Footer({ html }: FooterProps) {
  return (
    <footer
      className="py-6 px-6 text-sm"
      style={{
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--surface-alt)',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
