import { describe, it, expect } from 'vitest'
import { getDefaultNebulaParams, nebulaPalettes } from './nebulaConfig'

describe('nebulaConfig', () => {
  it('默认返回深色调色板', () => {
    const params = getDefaultNebulaParams(1000, false)
    expect(params.palette).toEqual(nebulaPalettes.dark)
  })

  it('传入 isLight=true 返回浅色调色板', () => {
    const params = getDefaultNebulaParams(1000, true)
    expect(params.palette).toEqual(nebulaPalettes.light)
  })

  it('保留传入的粒子数', () => {
    const params = getDefaultNebulaParams(7777, false)
    expect(params.particleCount).toBe(7777)
  })

  it('螺旋星系参数均为正值且核心半径小于星系半径', () => {
    const params = getDefaultNebulaParams(1000, false)
    const spiral = params.spiral
    expect(spiral.armCount).toBeGreaterThanOrEqual(2)
    expect(spiral.armTightness).toBeGreaterThan(0)
    expect(spiral.galaxyRadius).toBeGreaterThan(0)
    expect(spiral.coreRadius).toBeGreaterThan(0)
    expect(spiral.galaxyRadius).toBeGreaterThan(spiral.coreRadius)
    expect(spiral.discThickness).toBeGreaterThan(0)
    expect(spiral.armWidth).toBeGreaterThan(0)
    expect(spiral.armJitter).toBeGreaterThanOrEqual(0)
    expect(spiral.verticalJitter).toBeGreaterThanOrEqual(0)
    expect(spiral.starSizeMin).toBeGreaterThan(0)
    expect(spiral.starSizeMax).toBeGreaterThan(spiral.starSizeMin)
    expect(spiral.twinkleSpeed).toBeGreaterThan(0)
    expect(spiral.rotationSpeed).toBeGreaterThanOrEqual(0)
    expect(spiral.sizeScale).toBeGreaterThan(0)
  })

  it('背景星空参数合法', () => {
    const params = getDefaultNebulaParams(1000, false)
    const bg = params.background
    expect(bg.starCount).toBeGreaterThanOrEqual(800)
    expect(bg.radiusMax).toBeGreaterThan(bg.radiusMin)
    expect(bg.radiusMin).toBeGreaterThan(0)
    expect(bg.sizeMax).toBeGreaterThan(bg.sizeMin)
    expect(bg.sizeMin).toBeGreaterThan(0)
    expect(bg.jitter).toBeGreaterThanOrEqual(0)
    expect(bg.rotationSpeed).toBeGreaterThanOrEqual(0)
    expect(bg.twinkleSpeed).toBeGreaterThan(0)
  })

  it('体积星云参数随 volumetric 切换', () => {
    const on = getDefaultNebulaParams(10000, false, true)
    const off = getDefaultNebulaParams(10000, false, false)
    expect(on.nebula.stepCount).toBeGreaterThan(off.nebula.stepCount)
    expect(on.nebula.fbmOctaves).toBeGreaterThanOrEqual(off.nebula.fbmOctaves)
    expect(on.nebula.intensity).toBeGreaterThan(0)
    expect(on.nebula.sphereRadius).toBe(on.spiral.galaxyRadius)
    expect(on.nebula.rotationSpeed).toBeGreaterThanOrEqual(0)
    expect(on.nebula.turbulenceScale).toBeGreaterThan(0)
  })

  it('核心辉光参数合法且深色主题强度高于浅色', () => {
    const dark = getDefaultNebulaParams(1000, false)
    const light = getDefaultNebulaParams(1000, true)
    expect(dark.core.size).toBeGreaterThan(0)
    expect(dark.core.pulseSpeed).toBeGreaterThan(0)
    expect(dark.core.glowFalloff).toBeGreaterThan(0)
    expect(dark.core.intensity).toBeGreaterThan(light.core.intensity)
  })

  it('深色主题星云强度高于浅色主题', () => {
    const dark = getDefaultNebulaParams(1000, false)
    const light = getDefaultNebulaParams(1000, true)
    expect(dark.nebula.intensity).toBeGreaterThan(light.nebula.intensity)
  })

  it('粒子数达到阈值时启用流星', () => {
    const enabled = getDefaultNebulaParams(10000, false)
    const disabled = getDefaultNebulaParams(5000, false)
    expect(enabled.meteor.count).toBeGreaterThan(0)
    expect(disabled.meteor.count).toBe(0)
    expect(enabled.meteor.spawnRate).toBeGreaterThan(0)
    expect(enabled.meteor.bounds.x).toBeGreaterThan(0)
    expect(enabled.meteor.speed.max).toBeGreaterThan(enabled.meteor.speed.min)
  })

  it('粒子数提升时 sizeScale 阶梯式增加', () => {
    const low = getDefaultNebulaParams(5000, false)
    const mid = getDefaultNebulaParams(9000, false)
    const high = getDefaultNebulaParams(15000, false)
    expect(high.spiral.sizeScale).toBeGreaterThan(mid.spiral.sizeScale)
    expect(mid.spiral.sizeScale).toBeGreaterThan(low.spiral.sizeScale)
  })

  it('调色板所有颜色字段均为合法 hex', () => {
    const palettes = Object.values(nebulaPalettes)
    for (const palette of palettes) {
      const hexRegex = /^#[0-9a-fA-F]{6}$/
      expect(palette.background).toMatch(hexRegex)
      expect(palette.nebulaCore).toMatch(hexRegex)
      expect(palette.nebulaMid).toMatch(hexRegex)
      expect(palette.nebulaEdge).toMatch(hexRegex)
      expect(palette.starWarm).toMatch(hexRegex)
      expect(palette.starCool).toMatch(hexRegex)
      expect(palette.coreColor).toMatch(hexRegex)
      expect(palette.coreGlow).toMatch(hexRegex)
      expect(palette.meteor).toMatch(hexRegex)
      expect(palette.nebulaA).toMatch(hexRegex)
      expect(palette.nebulaB).toMatch(hexRegex)
      expect(palette.nebulaC).toMatch(hexRegex)
    }
  })

  it('视差强度为正值', () => {
    const params = getDefaultNebulaParams(1000, false)
    expect(params.parallaxStrength).toBeGreaterThan(0)
    expect(params.scrollParallaxStrength).toBeGreaterThan(0)
  })
})
