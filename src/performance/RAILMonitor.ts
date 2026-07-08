/**
 * RAIL / Core Web Vitals 运行时监控
 * 使用 web-vitals 库采集 CLS / INP / LCP / FCP / TTFB
 * 并将结果写入全局 store 与结构化日志
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'
import { useAppStore } from '../store/useAppStore'
import { logger } from '../observability/logger'
import type { PerformanceMetrics } from '../domain/types'

type MetricName = keyof PerformanceMetrics

type MetricHandler = (callback: (value: number) => void) => void

const METRIC_HANDLERS: Record<MetricName, MetricHandler> = {
  cls: (callback) => {
    onCLS((metric) => callback(metric.value))
  },
  inp: (callback) => {
    onINP((metric) => callback(metric.value))
  },
  lcp: (callback) => {
    onLCP((metric) => callback(metric.value))
  },
  fcp: (callback) => {
    onFCP((metric) => callback(metric.value))
  },
  ttfb: (callback) => {
    onTTFB((metric) => callback(metric.value))
  },
}

export function startRAILMonitoring(): void {
  const setMetrics = useAppStore.getState().setPerformanceMetrics

  ;(Object.keys(METRIC_HANDLERS) as MetricName[]).forEach((name) => {
    const handler = METRIC_HANDLERS[name]
    handler((value) => {
      setMetrics({ [name]: value })
      logger.info(`RAIL metric ${name.toUpperCase()}`, { metric: name, value })
    })
  })
}
