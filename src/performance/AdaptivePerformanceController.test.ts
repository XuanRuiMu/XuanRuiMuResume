import { describe, it, expect, vi } from 'vitest'
import { AdaptivePerformanceController } from './AdaptivePerformanceController'
import { QUALITY_LEVELS } from '../domain/constants'

describe('AdaptivePerformanceController', () => {
  it('reports zero metrics before any frames', () => {
    const controller = new AdaptivePerformanceController(QUALITY_LEVELS.HIGH)
    expect(controller.getMetrics()).toEqual({ p95: 0, avg: 0, fps: 0 })
    expect(controller.getLevel()).toBe(QUALITY_LEVELS.HIGH)
  })

  it('calculates p95 and average frame times', () => {
    const controller = new AdaptivePerformanceController(QUALITY_LEVELS.HIGH)
    for (let i = 0; i < 60; i += 1) {
      controller.recordFrame(16 + i * 0.1)
    }
    const metrics = controller.getMetrics()
    expect(metrics.avg).toBeGreaterThan(0)
    expect(metrics.p95).toBeGreaterThanOrEqual(metrics.avg)
    expect(metrics.fps).toBeGreaterThan(0)
  })

  it('degrades after sustained bad performance', () => {
    const onDegrade = vi.fn()
    const controller = new AdaptivePerformanceController(QUALITY_LEVELS.HIGH, {
      degradeThresholdMs: 20,
      degradeWindowMs: 100,
      onDegrade,
    })

    let elapsed = 0
    for (let i = 0; i < 3; i += 1) {
      elapsed += 50
      controller.update(elapsed, 50)
    }

    expect(onDegrade).toHaveBeenCalledTimes(1)
    expect(onDegrade).toHaveBeenCalledWith(QUALITY_LEVELS.MEDIUM)
    expect(controller.getLevel()).toBe(QUALITY_LEVELS.MEDIUM)
  })

  it('upgrades after sustained good performance', () => {
    const onUpgrade = vi.fn()
    const controller = new AdaptivePerformanceController(QUALITY_LEVELS.MEDIUM, {
      upgradeThresholdMs: 20,
      upgradeWindowMs: 100,
      onUpgrade,
    })

    let elapsed = 0
    for (let i = 0; i < 12; i += 1) {
      elapsed += 10
      controller.update(elapsed, 10)
    }

    expect(onUpgrade).toHaveBeenCalledTimes(1)
    expect(onUpgrade).toHaveBeenCalledWith(QUALITY_LEVELS.HIGH)
    expect(controller.getLevel()).toBe(QUALITY_LEVELS.HIGH)
  })

  it('does not degrade below low', () => {
    const onDegrade = vi.fn()
    const controller = new AdaptivePerformanceController(QUALITY_LEVELS.LOW, {
      degradeThresholdMs: 10,
      degradeWindowMs: 1,
      onDegrade,
    })
    controller.update(100, 100)
    expect(onDegrade).not.toHaveBeenCalled()
    expect(controller.getLevel()).toBe(QUALITY_LEVELS.LOW)
  })
})
