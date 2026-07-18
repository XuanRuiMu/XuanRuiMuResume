import { describe, it, expect } from 'vitest'
import { generateStarField } from './starFieldGenerator'
import { getDefaultNebulaParams } from './nebulaConfig'

describe('generateStarField', () => {
  it('generates deterministic particle data', () => {
    const params = getDefaultNebulaParams(100, false)
    const first = generateStarField(100, params, 31)
    const second = generateStarField(100, params, 31)

    expect(first.positions.length).toBe(300)
    expect(first.colors.length).toBe(300)
    expect(first.sizes.length).toBe(100)
    expect(first.phases.length).toBe(100)
    expect(first.speeds.length).toBe(100)

    expect(first.positions.every((value, index) => value === second.positions[index])).toBe(true)
    expect(first.colors.every((value, index) => value === second.colors[index])).toBe(true)
    expect(first.sizes.every((value, index) => value === second.sizes[index])).toBe(true)
    expect(first.phases.every((value, index) => value === second.phases[index])).toBe(true)
    expect(first.speeds.every((value, index) => value === second.speeds[index])).toBe(true)
  })

  it('places stars within the configured shell radius range', () => {
    const params = getDefaultNebulaParams(200, false)
    const data = generateStarField(200, params, 7)

    for (let i = 0; i < 200; i += 1) {
      const x = data.positions[i * 3]
      const y = data.positions[i * 3 + 1]
      const z = data.positions[i * 3 + 2]
      const r = Math.sqrt(x * x + y * y + z * z)
      expect(r).toBeGreaterThanOrEqual(params.starRadiusMin * 0.9)
      expect(r).toBeLessThanOrEqual(params.starRadiusMax * 1.1)
    }
  })

  it('produces different output with different seeds', () => {
    const params = getDefaultNebulaParams(50, false)
    const a = generateStarField(50, params, 1)
    const b = generateStarField(50, params, 2)

    let diffCount = 0
    for (let i = 0; i < a.positions.length; i += 1) {
      if (a.positions[i] !== b.positions[i]) diffCount += 1
    }
    expect(diffCount).toBeGreaterThan(0)
  })

  it('keeps phases in [0, 2π) and speeds positive', () => {
    const params = getDefaultNebulaParams(100, false)
    const data = generateStarField(100, params, 5)

    for (let i = 0; i < 100; i += 1) {
      expect(data.phases[i]).toBeGreaterThanOrEqual(0)
      expect(data.phases[i]).toBeLessThan(Math.PI * 2)
      expect(data.speeds[i]).toBeGreaterThan(0)
      expect(data.sizes[i]).toBeGreaterThan(0)
    }
  })

  it('keeps star sizes within the configured size range', () => {
    const params = getDefaultNebulaParams(150, false)
    const data = generateStarField(150, params, 11)

    const epsilon = 1e-3
    for (let i = 0; i < 150; i += 1) {
      expect(data.sizes[i]).toBeGreaterThanOrEqual(params.starSizeMin - epsilon)
      expect(data.sizes[i]).toBeLessThanOrEqual(params.starSizeMax + epsilon)
    }
  })
})
