import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const IMAGES = ['img_1.jpg', 'img_2.jpg', 'img_3.jpg']

export function ImageCarousel() {
  const [current, setCurrent] = useState(0)
  const prev = () => setCurrent((c) => (c - 1 + IMAGES.length) % IMAGES.length)
  const next = () => setCurrent((c) => (c + 1) % IMAGES.length)

  return (
    <div>
      <p
        className="text-xs font-medium uppercase tracking-widest mb-2"
        style={{ color: 'var(--text-muted)' }}
      >
        Gallery
      </p>
      <div
        className="relative overflow-hidden rounded-xl"
        style={{ border: '1px solid var(--border)' }}
      >
        <img
          src={`/assets/images/${IMAGES[current]}`}
          alt={`Gallery image ${current + 1} of ${IMAGES.length}`}
          className="w-full h-64 object-cover bg-[var(--surface-inset)]"
        />
        <button
          onClick={prev}
          aria-label="Previous image"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/55 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={next}
          aria-label="Next image"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/55 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to image ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === current ? 'bg-white' : 'bg-white/45'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
