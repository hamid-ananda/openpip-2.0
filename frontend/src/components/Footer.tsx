interface FooterProps {
  html: string
}

export function Footer({ html }: FooterProps) {
  return (
    <footer
      className="py-4 px-6 text-sm text-gray-600 border-t"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
