/**
 * 自适应性能控制器
 * 基于帧时间 p95 与持续窗口决定是否需要自动降级或升级画质
 */

import type { QualityLevel } from '../domain/types'
import { QUALITY_LEVELS } from '../domain/constants'

const LEVEL_ORDER: QualityLevel[] = [
  QUALITY_LEVELS.ULTRA,
  QUALITY_LEVELS.HIGH,
  QUALITY_LEVELS.MEDIUM,
  QUALITY_LEVELS.LOW,
]

export interface AdaptiveOptions {
  onDegrade?: (level: QualityLevel) => void
  onUpgrade?: (level: QualityLevel) => void
  degradeThresholdMs?: number
  upgradeThresholdMs?: number
  degradeWindowMs?: number
  upgradeWindowMs?: number
  maxSamples?: number
}

export interface FrameMetricsSnapshot {
  p95: number
  avg: number
  fps: number
}

export class AdaptivePerformanceController {
  private samples: number[] = []
  private lastCheckTime = 0
  private accumulatedBadTime = 0
  private accumulatedGoodTime = 0
  private currentLevel: QualityLevel
  private options: Required<AdaptiveOptions>

  constructor(initialLevel: QualityLevel, options: AdaptiveOptions = {}) {
    this.currentLevel = initialLevel
    this.options = {
      onDegrade: options.onDegrade ?? (() => {}),
      onUpgrade: options.onUpgrade ?? (() => {}),
      degradeThresholdMs: options.degradeThresholdMs ?? 1000 / 30,
      upgradeThresholdMs: options.upgradeThresholdMs ?? 1000 / 55,
      degradeWindowMs: options.degradeWindowMs ?? 3000,
      upgradeWindowMs: options.upgradeWindowMs ?? 5000,
      maxSamples: options.maxSamples ?? 60,
    }
  }

  recordFrame(deltaMs: number): void {
    this.samples.push(deltaMs)
    if (this.samples.length > this.options.maxSamples) {
      this.samples.shift()
    }
  }

  getMetrics(): FrameMetricsSnapshot {
    if (this.samples.length === 0) {
      return { p95: 0, avg: 0, fps: 0 }
    }
    const sorted = [...this.samples].sort((a, b) => a - b)
    const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1)
    const p95 = sorted[index]
    const avg = this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length
    return {
      p95,
      avg,
      fps: avg > 0 ? Math.round(1000 / avg) : 0,
    }
  }

  update(elapsedMs: number, deltaMs: number): void {
    this.recordFrame(deltaMs)
    const { p95 } = this.getMetrics()

    const dt = Math.max(0, elapsedMs - this.lastCheckTime)
    this.lastCheckTime = elapsedMs

    if (Number.isFinite(p95) && p95 > this.options.degradeThresholdMs) {
      this.accumulatedBadTime += dt
      this.accumulatedGoodTime = 0
      if (this.accumulatedBadTime >= this.options.degradeWindowMs) {
        this.degrade()
        this.accumulatedBadTime = 0
      }
    } else if (Number.isFinite(p95) && p95 < this.options.upgradeThresholdMs) {
      this.accumulatedGoodTime += dt
      this.accumulatedBadTime = 0
      if (this.accumulatedGoodTime >= this.options.upgradeWindowMs) {
        this.upgrade()
        this.accumulatedGoodTime = 0
      }
    } else {
      this.accumulatedGoodTime = 0
      this.accumulatedBadTime = 0
    }
  }

  private degrade(): void {
    const index = LEVEL_ORDER.indexOf(this.currentLevel)
    if (index < LEVEL_ORDER.length - 1) {
      this.currentLevel = LEVEL_ORDER[index + 1]
      this.options.onDegrade(this.currentLevel)
    }
  }

  private upgrade(): void {
    const index = LEVEL_ORDER.indexOf(this.currentLevel)
    if (index > 0) {
      this.currentLevel = LEVEL_ORDER[index - 1]
      this.options.onUpgrade(this.currentLevel)
    }
  }

  getLevel(): QualityLevel {
    return this.currentLevel
  }
}
