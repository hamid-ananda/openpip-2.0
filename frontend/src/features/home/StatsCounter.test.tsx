import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { StatsCounter } from './StatsCounter'

vi.mock('../../lib/useCountUp', () => ({
  useCountUp: (target: number) => target,
}))

describe('StatsCounter', () => {
  it('displays formatted protein count', () => {
    render(<StatsCounter proteins={8275} interactions={52569} />)
    expect(screen.getByText('8,275')).toBeInTheDocument()
    expect(screen.getByText(/proteins/i)).toBeInTheDocument()
  })

  it('displays formatted interaction count', () => {
    render(<StatsCounter proteins={8275} interactions={52569} />)
    expect(screen.getByText('52,569')).toBeInTheDocument()
    expect(screen.getByText(/interactions/i)).toBeInTheDocument()
  })
})
