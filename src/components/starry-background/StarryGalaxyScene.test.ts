import { describe, expect, it } from 'vitest'
import { DEFAULT_EFFECT_PARAMS } from './StarryGalaxyScene'

describe('StarryGalaxyScene 默认特效参数', () => {
  it('超新星默认频率为 0.5', () => {
    expect(DEFAULT_EFFECT_PARAMS.supernova.frequency).toBe(0.5)
  })

  it('星云默认数量为 6', () => {
    expect(DEFAULT_EFFECT_PARAMS.nebula.count).toBe(6)
  })

  it('星云默认透明度为 0.5', () => {
    expect(DEFAULT_EFFECT_PARAMS.nebula.opacity).toBe(0.5)
  })

  it('星星闪烁默认强度为 0.6', () => {
    expect(DEFAULT_EFFECT_PARAMS.twinkle.intensity).toBe(0.6)
  })

  it('星星闪烁默认速度为 1.85', () => {
    expect(DEFAULT_EFFECT_PARAMS.twinkle.speed).toBe(1.85)
  })

  it('尘埃粒子默认透明度为 1', () => {
    expect(DEFAULT_EFFECT_PARAMS.stardust.opacity).toBe(1)
  })
})
