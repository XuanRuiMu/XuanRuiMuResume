import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

const MEMORY_POLL_INTERVAL = 2000

function formatMetric(value) {
  if (value === undefined || value === null) return '-'
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 10 ? value.toFixed(2) : Math.round(value).toString()
  }
  return String(value)
}

export function PerformanceMonitor({ visible = import.meta.env.DEV }) {
  const [memory, setMemory] = useState(null)
  const frameMetrics = useAppStore((state) => state.frameMetrics)
  const performanceMetrics = useAppStore((state) => state.performanceMetrics)
  const qualityLevel = useAppStore((state) => state.qualityLevel)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!visible) return

    intervalRef.current = window.setInterval(() => {
      if (window.performance && 'memory' in window.performance) {
        const mem = window.performance.memory
        setMemory({
          used: (mem.usedJSHeapSize / 1048576).toFixed(1),
          total: (mem.totalJSHeapSize / 1048576).toFixed(1),
        })
      }
    }, MEMORY_POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [visible])

  if (!visible) return null

  const { fps, p95, avg, downgradeCount, upgradeCount } = frameMetrics
  const { lcp, inp, cls, fcp, ttfb } = performanceMetrics
  const color = fps >= 55 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#f87171'

  return (
    <div className="fixed bottom-4 left-4 z-[70] rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-[11px] font-mono text-white/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span>FPS: {formatMetric(fps)}</span>
        <span className="text-white/40">|</span>
        <span>p95: {formatMetric(p95)}ms</span>
        <span className="text-white/40">|</span>
        <span>avg: {formatMetric(avg)}ms</span>
      </div>

      <div className="mt-1.5 grid grid-cols-3 gap-x-3 gap-y-0.5 text-white/60">
        <span>LCP: {formatMetric(lcp)}</span>
        <span>INP: {formatMetric(inp)}</span>
        <span>CLS: {formatMetric(cls)}</span>
        <span>FCP: {formatMetric(fcp)}</span>
        <span>TTFB: {formatMetric(ttfb)}</span>
      </div>

      <div className="mt-1.5 flex items-center gap-3 text-white/60">
        <span>Quality: {qualityLevel.toUpperCase()}</span>
        <span>Down: {downgradeCount}</span>
        <span>Up: {upgradeCount}</span>
      </div>

      {memory && (
        <div className="mt-1 text-white/50">
          MEM: {memory.used} / {memory.total} MB
        </div>
      )}
    </div>
  )
}
