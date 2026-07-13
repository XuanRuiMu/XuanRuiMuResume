import { describe, it, expect } from 'vitest'
import { createStarLayer } from './starLayer'

describe('createStarLayer', () => {
  it('generates deterministic star layer data', () => {
    const data = createStarLayer(10, [5, 10], [0.01, 0.05], ['#ffffff', '#00d9ff'], 7)

    expect(data.positions.length).toBe(30)
    expect(data.colors.length).toBe(30)
    expect(data.sizes.length).toBe(10)
    expect(data.phases.length).toBe(10)
    expect(data.speeds.length).toBe(10)

    const second = createStarLayer(10, [5, 10], [0.01, 0.05], ['#ffffff', '#00d9ff'], 7)
    expect(data.positions.every((value, index) => value === second.positions[index])).toBe(true)
  })

  it('distributes stars within the requested radius range', () => {
    const data = createStarLayer(50, [8, 12], [0.01, 0.05], ['#ffffff'], 1)

    for (let i = 0; i < 50; i += 1) {
      const x = data.positions[i * 3]
      const y = data.positions[i * 3 + 1]
      const z = data.positions[i * 3 + 2]
      const radius = Math.sqrt(x * x + y * y + z * z)
      expect(radius).toBeGreaterThanOrEqual(8)
      expect(radius).toBeLessThanOrEqual(12)
    }
  })
})
