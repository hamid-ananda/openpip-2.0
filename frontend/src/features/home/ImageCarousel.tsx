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
        className="relative h-64 overflow-hidden rounded-xl"
        style={{ border: '1px solid var(--border)' }}
      >
        {IMAGES.map((img, i) => (
          <img
            key={img}
            src={`/assets/images/${img}`}
            alt={`Gallery image ${i + 1} of ${IMAGES.length}`}
            aria-hidden={i !== current}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: i === current ? 1 : 0,
              transition: 'opacity 300ms var(--ease-out-quart)',
              backgroundColor: 'var(--surface-inset)',
            }}
          />
        ))}
        <button
          onClick={prev}
          aria-label="Previous image"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/55 transition-colors"
          style={{ zIndex: 1 }}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={next}
          aria-label="Next image"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/55 transition-colors"
          style={{ zIndex: 1 }}
        >
          <ChevronRight size={18} />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" style={{ zIndex: 1 }}>
          {IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to image ${i + 1}`}
              className="w-1.5 h-1.5 rounded-full transition-colors"
              style={{
                backgroundColor: i === current ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.45)',
                transitionDuration: '200ms',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
