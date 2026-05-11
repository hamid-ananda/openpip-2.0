import { useState } from 'react'
import { useContact } from '../../api/contact'

export function ContactPage() {
  const { mutate: submit, isPending, isSuccess, error } = useContact()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto mt-16 px-4 text-center">
        <p className="text-green-700 font-medium text-lg mb-2">Message sent!</p>
        <p className="text-gray-600">Thank you for contacting us. We'll respond shortly.</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-main)' }}>
        Contact
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(form)
        }}
        className="flex flex-col gap-4"
      >
        {(['name', 'email', 'subject'] as const).map((field) => (
          <div key={field}>
            <label
              htmlFor={`contact-${field}`}
              className="block text-sm font-medium text-gray-700 mb-1 capitalize"
            >
              {field}
            </label>
            <input
              id={`contact-${field}`}
              type={field === 'email' ? 'email' : 'text'}
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        ))}
        <div>
          <label
            htmlFor="contact-message"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Message
          </label>
          <textarea
            id="contact-message"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            required
            rows={5}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-y"
          />
        </div>
        {error && <p className="text-red-600 text-sm">Failed to send. Please try again.</p>}
        <button
          type="submit"
          disabled={isPending}
          className="py-2 rounded text-white text-sm font-medium disabled:opacity-60"
          style={{ background: 'var(--color-button)' }}
        >
          {isPending ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}
