import { useEffect, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

const PARTICLE_OPTIONS = {
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  particles: {
    number: { value: 60, density: { enable: true } },
    color: { value: '#ffffff' },
    opacity: { value: 0.3 },
    size: { value: { min: 1, max: 3 } },
    move: { enable: true, speed: 1, outModes: { default: 'bounce' as const } },
    links: { enable: true, color: '#ffffff', opacity: 0.2 },
  },
  detectRetina: true,
}

interface ParticleBackgroundProps {
  id: string
  className?: string
}

export function ParticleBackground({ id, className }: ParticleBackgroundProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setReady(true))
  }, [])

  if (!ready) return null
  return <Particles id={id} className={className} options={PARTICLE_OPTIONS} />
}
