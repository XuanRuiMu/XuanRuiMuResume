import { describe, it, expect } from 'vitest'
import { getDefaultGalaxyParams, galaxyPalettes } from './galaxyConfig'

describe('galaxyConfig', () => {
  it('returns dark palette by default', () => {
    const params = getDefaultGalaxyParams(1000, false)
    expect(params.palette).toEqual(galaxyPalettes.dark)
  })

  it('returns light palette when requested', () => {
    const params = getDefaultGalaxyParams(1000, true)
    expect(params.palette).toEqual(galaxyPalettes.light)
  })

  it('respects the requested particle count', () => {
    const params = getDefaultGalaxyParams(7777, false)
    expect(params.particleCount).toBe(7777)
  })

  it('uses positive physical parameters', () => {
    const params = getDefaultGalaxyParams(1000, false)
    expect(params.arms).toBeGreaterThan(0)
    expect(params.tightness).toBeGreaterThan(0)
    expect(params.armWidth).toBeGreaterThan(0)
    expect(params.innerRadius).toBeGreaterThan(0)
    expect(params.outerRadius).toBeGreaterThan(params.innerRadius)
    expect(params.thickness).toBeGreaterThan(0)
    expect(params.rotationSpeed).toBeGreaterThanOrEqual(0)
    expect(params.intensity).toBeGreaterThan(0)
    expect(params.sizeMultiplier).toBeGreaterThan(0)
  })

  it('boosts intensity and size for light theme', () => {
    const light = getDefaultGalaxyParams(1000, true)
    const dark = getDefaultGalaxyParams(1000, false)
    expect(light.intensity).toBeGreaterThan(dark.intensity)
    expect(light.sizeMultiplier).toBeGreaterThan(dark.sizeMultiplier)
  })
})
