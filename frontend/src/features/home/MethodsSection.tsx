interface MethodsSectionProps {
  title: string
  text: string
}

export function MethodsSection({ title, text }: MethodsSectionProps) {
  return (
    <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-main)' }}>
      <div className="max-w-3xl mx-auto" style={{ color: 'var(--color-header)' }}>
        <div
          className="text-xl font-semibold mb-4"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        <div
          className="leading-relaxed opacity-85"
          style={{ fontSize: '15px', maxWidth: '65ch' }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      </div>
    </section>
  )
}
