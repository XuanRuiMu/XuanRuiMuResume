import { describe, it, expect } from 'vitest'
import { getDefaultNebulaParams, nebulaPalettes } from './nebulaConfig'

describe('nebulaConfig', () => {
  it('returns dark palette by default', () => {
    const params = getDefaultNebulaParams(1000, false)
    expect(params.palette).toEqual(nebulaPalettes.dark)
  })

  it('returns light palette when requested', () => {
    const params = getDefaultNebulaParams(1000, true)
    expect(params.palette).toEqual(nebulaPalettes.light)
  })

  it('respects the requested particle count', () => {
    const params = getDefaultNebulaParams(7777, false)
    expect(params.particleCount).toBe(7777)
  })

  it('uses positive geometry parameters', () => {
    const params = getDefaultNebulaParams(1000, false)
    expect(params.starRadiusMin).toBeGreaterThan(0)
    expect(params.starRadiusMax).toBeGreaterThan(params.starRadiusMin)
    expect(params.starSizeMin).toBeGreaterThan(0)
    expect(params.starSizeMax).toBeGreaterThan(params.starSizeMin)
    expect(params.nebulaRadius).toBeGreaterThan(params.starRadiusMax)
    expect(params.nebulaIntensity).toBeGreaterThan(0)
    expect(params.twinkleSpeed).toBeGreaterThan(0)
    expect(params.rotationSpeed).toBeGreaterThanOrEqual(0)
    expect(params.meteorCount).toBeGreaterThanOrEqual(0)
    expect(params.meteorSpawnRate).toBeGreaterThan(0)
    expect(params.parallaxStrength).toBeGreaterThan(0)
    expect(params.scrollParallaxStrength).toBeGreaterThan(0)
    expect(params.starJitter).toBeGreaterThanOrEqual(0)
  })

  it('boosts intensity for dark theme over light theme', () => {
    const dark = getDefaultNebulaParams(1000, false)
    const light = getDefaultNebulaParams(1000, true)
    expect(dark.nebulaIntensity).toBeGreaterThan(light.nebulaIntensity)
  })

  it('keeps nebula palette colors as valid hex strings', () => {
    const palettes = Object.values(nebulaPalettes)
    for (const palette of palettes) {
      expect(palette.background).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(palette.nebulaA).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(palette.nebulaB).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(palette.nebulaC).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(palette.starWarm).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(palette.starCool).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(palette.meteor).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})
