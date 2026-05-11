import { useState } from 'react'

const IMAGES = ['img_1.jpg', 'img_2.jpg', 'img_3.jpg']

export function ImageCarousel() {
  const [current, setCurrent] = useState(0)
  const prev = () => setCurrent((c) => (c - 1 + IMAGES.length) % IMAGES.length)
  const next = () => setCurrent((c) => (c + 1) % IMAGES.length)

  return (
    <div className="relative overflow-hidden rounded border">
      <img
        src={`/assets/images/${IMAGES[current]}`}
        alt={`Slide ${current + 1}`}
        className="w-full h-64 object-cover bg-gray-100"
      />
      <button onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-1 rounded text-lg">
        ‹
      </button>
      <button onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-1 rounded text-lg">
        ›
      </button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {IMAGES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full ${i === current ? 'bg-white' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  )
}
