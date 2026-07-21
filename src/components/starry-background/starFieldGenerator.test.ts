import { describe, it, expect } from 'vitest'
import { generateBackgroundStars, generateSpiralGalaxy, generateStarField } from './starFieldGenerator'
import { getDefaultNebulaParams } from './nebulaConfig'

describe('generateSpiralGalaxy', () => {
  it('generates deterministic particle data', () => {
    const params = getDefaultNebulaParams(100, false)
    const first = generateSpiralGalaxy(100, params, 31)
    const second = generateSpiralGalaxy(100, params, 31)

    expect(first.positions.length).toBe(300)
    expect(first.colors.length).toBe(300)
    expect(first.sizes.length).toBe(100)
    expect(first.phases.length).toBe(100)
    expect(first.speeds.length).toBe(100)
    expect(first.radii.length).toBe(100)
    expect(first.armIndices.length).toBe(100)

    expect(first.positions.every((value, index) => value === second.positions[index])).toBe(true)
    expect(first.colors.every((value, index) => value === second.colors[index])).toBe(true)
    expect(first.sizes.every((value, index) => value === second.sizes[index])).toBe(true)
    expect(first.phases.every((value, index) => value === second.phases[index])).toBe(true)
    expect(first.speeds.every((value, index) => value === second.speeds[index])).toBe(true)
    expect(first.radii.every((value, index) => value === second.radii[index])).toBe(true)
    expect(first.armIndices.every((value, index) => value === second.armIndices[index])).toBe(true)
  })

  it('places particles within the galaxy radius bounds', () => {
    const params = getDefaultNebulaParams(500, false)
    const data = generateSpiralGalaxy(500, params, 7)
    const maxRadius = params.spiral.galaxyRadius * 1.1

    for (let i = 0; i < 500; i += 1) {
      const x = data.positions[i * 3]
      const y = data.positions[i * 3 + 1]
      const z = data.positions[i * 3 + 2]
      const horizontalRadius = Math.sqrt(x * x + z * z)
      expect(horizontalRadius).toBeGreaterThanOrEqual(0)
      expect(horizontalRadius).toBeLessThanOrEqual(maxRadius)
      expect(Math.abs(y)).toBeLessThanOrEqual(params.spiral.discThickness * 1.5)
    }
  })

  it('concentrates particles near the center (density falloff)', () => {
    const params = getDefaultNebulaParams(1000, false)
    const data = generateSpiralGalaxy(1000, params, 11)
    const halfRadius = params.spiral.galaxyRadius * 0.5
    let innerCount = 0
    for (let i = 0; i < 1000; i += 1) {
      const x = data.positions[i * 3]
      const z = data.positions[i * 3 + 2]
      const r = Math.sqrt(x * x + z * z)
      if (r < halfRadius) innerCount += 1
    }
    expect(innerCount).toBeGreaterThan(400)
  })

  it('produces different output with different seeds', () => {
    const params = getDefaultNebulaParams(100, false)
    const a = generateSpiralGalaxy(100, params, 1)
    const b = generateSpiralGalaxy(100, params, 2)

    let diffCount = 0
    for (let i = 0; i < a.positions.length; i += 1) {
      if (a.positions[i] !== b.positions[i]) diffCount += 1
    }
    expect(diffCount).toBeGreaterThan(0)
  })

  it('keeps phases in [0, 2π) and speeds positive', () => {
    const params = getDefaultNebulaParams(100, false)
    const data = generateSpiralGalaxy(100, params, 5)

    for (let i = 0; i < 100; i += 1) {
      expect(data.phases[i]).toBeGreaterThanOrEqual(0)
      expect(data.phases[i]).toBeLessThan(Math.PI * 2)
      expect(data.speeds[i]).toBeGreaterThan(0)
      expect(data.sizes[i]).toBeGreaterThan(0)
      expect(data.radii[i]).toBeGreaterThan(0)
      expect(data.armIndices[i]).toBeGreaterThanOrEqual(0)
      expect(data.armIndices[i]).toBeLessThan(params.spiral.armCount)
    }
  })

  it('keeps star sizes within the configured size range with core boost', () => {
    const params = getDefaultNebulaParams(200, false)
    const data = generateSpiralGalaxy(200, params, 11)
    const maxSize = params.spiral.starSizeMax * 2

    for (let i = 0; i < 200; i += 1) {
      expect(data.sizes[i]).toBeGreaterThanOrEqual(params.spiral.starSizeMin * 0.5)
      expect(data.sizes[i]).toBeLessThanOrEqual(maxSize)
    }
  })

  it('generateStarField aliases generateSpiralGalaxy', () => {
    const params = getDefaultNebulaParams(50, false)
    const a = generateStarField(50, params, 13)
    const b = generateSpiralGalaxy(50, params, 13)
    expect(a.positions).toStrictEqual(b.positions)
    expect(a.colors).toStrictEqual(b.colors)
    expect(a.sizes).toStrictEqual(b.sizes)
  })
})

describe('generateBackgroundStars', () => {
  it('generates the requested count of background stars', () => {
    const params = getDefaultNebulaParams(1000, false)
    const data = generateBackgroundStars(params, 99)
    const expectedCount = params.background.starCount
    expect(data.positions.length).toBe(expectedCount * 3)
    expect(data.colors.length).toBe(expectedCount * 3)
    expect(data.sizes.length).toBe(expectedCount)
    expect(data.phases.length).toBe(expectedCount)
    expect(data.speeds.length).toBe(expectedCount)
  })

  it('places background stars within the configured shell radius', () => {
    const params = getDefaultNebulaParams(1000, false)
    const data = generateBackgroundStars(params, 7)

    for (let i = 0; i < params.background.starCount; i += 1) {
      const x = data.positions[i * 3]
      const y = data.positions[i * 3 + 1]
      const z = data.positions[i * 3 + 2]
      const r = Math.sqrt(x * x + y * y + z * z)
      expect(r).toBeGreaterThanOrEqual(params.background.radiusMin * 0.9)
      expect(r).toBeLessThanOrEqual(params.background.radiusMax * 1.1)
    }
  })

  it('is deterministic with the same seed', () => {
    const params = getDefaultNebulaParams(500, false)
    const a = generateBackgroundStars(params, 11)
    const b = generateBackgroundStars(params, 11)
    expect(a.positions.every((v, i) => v === b.positions[i])).toBe(true)
  })
})
