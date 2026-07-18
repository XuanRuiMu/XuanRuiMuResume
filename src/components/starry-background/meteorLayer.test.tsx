import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MeteorLayer } from './meteorLayer'
import { createMeteor } from './meteorUtils'

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
}))

describe('createMeteor', () => {
  it('creates an inactive meteor with valid bounds', () => {
    const bounds = { x: 30, y: 18, z: 10 }
    const speed = { min: 8, max: 16 }
    const m = createMeteor(bounds, speed)

    expect(m.active).toBe(false)
    expect(m.life).toBe(0)
    expect(m.maxLife).toBeGreaterThan(0)
    expect(m.positions.length).toBe(6)
    expect(m.velocity).toHaveLength(3)
  })

  it('respects speed bounds', () => {
    const bounds = { x: 30, y: 18, z: 10 }
    const speed = { min: 4, max: 6 }
    for (let i = 0; i < 30; i += 1) {
      const m = createMeteor(bounds, speed)
      const v = Math.hypot(m.velocity[0], m.velocity[1], m.velocity[2])
      expect(v).toBeGreaterThanOrEqual(speed.min * 0.95)
      expect(v).toBeLessThanOrEqual(speed.max * 1.05)
    }
  })

  it('keeps start positions within the configured bounds', () => {
    const bounds = { x: 30, y: 18, z: 10 }
    const speed = { min: 8, max: 16 }
    for (let i = 0; i < 30; i += 1) {
      const m = createMeteor(bounds, speed)
      expect(m.positions[0]).toBeLessThanOrEqual(0)
      expect(m.positions[0]).toBeGreaterThanOrEqual(-bounds.x)
      expect(m.positions[1]).toBeGreaterThanOrEqual(0)
      expect(m.positions[1]).toBeLessThanOrEqual(bounds.y)
      expect(m.positions[2]).toBeLessThanOrEqual(0)
      expect(m.positions[2]).toBeGreaterThanOrEqual(-bounds.z)
    }
  })
})

describe('MeteorLayer', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a lineSegments primitive', () => {
    const { container } = render(
      <MeteorLayer
        count={3}
        spawnRate={0.1}
        color="#e6f7ff"
        bounds={{ x: 30, y: 18, z: 10 }}
        speed={{ min: 8, max: 16 }}
      />
    )
    expect(container.querySelector('linesegments')).toBeInTheDocument()
  })

  it('renders without crashing when count is zero', () => {
    const { container } = render(
      <MeteorLayer
        count={0}
        spawnRate={0.1}
        color="#e6f7ff"
        bounds={{ x: 30, y: 18, z: 10 }}
        speed={{ min: 8, max: 16 }}
      />
    )
    expect(container.querySelector('linesegments')).toBeInTheDocument()
  })
})
