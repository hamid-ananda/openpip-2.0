interface MethodsSectionProps {
  title: string
  text: string
}

export function MethodsSection({ title, text }: MethodsSectionProps) {
  return (
    <section className="py-12 px-6" style={{ backgroundColor: 'var(--color-main)' }}>
      <div className="max-w-4xl mx-auto" style={{ color: 'var(--color-header)' }}>
        <div className="font-semibold mb-2" dangerouslySetInnerHTML={{ __html: title }} />
        <div style={{ fontSize: '18px' }} dangerouslySetInnerHTML={{ __html: text }} />
      </div>
    </section>
  )
}
