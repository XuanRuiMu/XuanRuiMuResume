import { describe, it, expect } from 'vitest'
import { generateSpiralGalaxy } from './galaxyGenerator'
import { getDefaultGalaxyParams } from './galaxyConfig'

describe('generateSpiralGalaxy', () => {
  it('generates deterministic particle data', () => {
    const params = getDefaultGalaxyParams(100, false)
    const first = generateSpiralGalaxy(100, params, 31)
    const second = generateSpiralGalaxy(100, params, 31)

    expect(first.positions.length).toBe(300)
    expect(first.colors.length).toBe(300)
    expect(first.sizes.length).toBe(100)
    expect(first.phases.length).toBe(100)
    expect(first.originalPositions.length).toBe(300)
    expect(first.armIndices.length).toBe(100)

    expect(first.positions.every((value, index) => value === second.positions[index])).toBe(true)
    expect(first.colors.every((value, index) => value === second.colors[index])).toBe(true)
    expect(first.sizes.every((value, index) => value === second.sizes[index])).toBe(true)
  })

  it('places particles within the configured radius range', () => {
    const params = getDefaultGalaxyParams(200, false)
    const data = generateSpiralGalaxy(200, params, 7)

    for (let i = 0; i < 200; i += 1) {
      const x = data.positions[i * 3]
      const y = data.positions[i * 3 + 1]
      const z = data.positions[i * 3 + 2]
      const r = Math.sqrt(x * x + y * y + z * z)
      expect(r).toBeGreaterThanOrEqual(params.innerRadius * 0.5)
      expect(r).toBeLessThanOrEqual(params.outerRadius * 1.5)
    }
  })

  it('produces different seeds with different seeds', () => {
    const params = getDefaultGalaxyParams(50, false)
    const a = generateSpiralGalaxy(50, params, 1)
    const b = generateSpiralGalaxy(50, params, 2)

    let diffCount = 0
    for (let i = 0; i < a.positions.length; i += 1) {
      if (a.positions[i] !== b.positions[i]) diffCount += 1
    }
    expect(diffCount).toBeGreaterThan(0)
  })

  it('preserves original positions equal to initial positions', () => {
    const params = getDefaultGalaxyParams(50, false)
    const data = generateSpiralGalaxy(50, params, 99)

    for (let i = 0; i < data.positions.length; i += 1) {
      expect(data.originalPositions[i]).toBe(data.positions[i])
    }
  })

  it('limits arm indices to the configured arm count', () => {
    const params = getDefaultGalaxyParams(100, false)
    const data = generateSpiralGalaxy(100, params, 5)

    for (let i = 0; i < 100; i += 1) {
      expect(data.armIndices[i]).toBeGreaterThanOrEqual(0)
      expect(data.armIndices[i]).toBeLessThan(params.arms)
    }
  })
})
