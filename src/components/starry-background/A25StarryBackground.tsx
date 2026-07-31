import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { usePerformanceProfile } from '../../hooks/usePerformanceProfile'
import { createA25StarryScene, type A25StarrySceneApi } from './A25StarryScene'
import { StarryBackgroundContext } from './StarryBackgroundContext'
import { useIsDarkMode } from './useIsDarkMode'

interface A25StarryBackgroundProps {
  className?: string
  children?: ReactNode
}

/**
 * 星空背景 Provider：既渲染全屏星空画布，又把场景 api 通过 context
 * 提供给所有 children（含右上角的 StarryBackgroundControls）。
 * 之前 Provider 只包裹画布自身，导致控制面板拿不到 api —— 这里修复。
 *
 * 星空是深色主题元素（与水墨揭示一致），只在深色模式渲染；
 * 浅色模式下不渲染，让浅色 body 背景保证文字可读。
 */
export function A25StarryBackground({ className, children }: A25StarryBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [api, setApi] = useState<A25StarrySceneApi | null>(null)
  const [inkRevealEnabled, setInkRevealEnabled] = useState(true)
  const { settings, loading } = usePerformanceProfile()
  const reducedMotion = useReducedMotion()
  const isDark = useIsDarkMode()

  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion || !isDark) return
    const container = containerRef.current
    if (!container) return

    const dpr = Array.isArray(settings.dpr) ? settings.dpr[0] : settings.dpr
    const scene = createA25StarryScene(container, {
      particleCount: settings.particleCount,
      dpr,
      rotationSpeed: 0.1,
    })
    setApi(scene)

    return () => {
      scene.destroy()
      setApi(null)
    }
  }, [settings, reducedMotion, isDark])

  const showCanvas = isDark && !loading && !reducedMotion
  const contextValue = api
    ? { ...api, inkRevealEnabled, setInkRevealEnabled }
    : { inkRevealEnabled, setInkRevealEnabled }

  return (
    <StarryBackgroundContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn('fixed inset-0 z-0', showCanvas ? '' : isDark ? 'bg-[#05060f]' : 'bg-transparent', className)}
        aria-hidden="true"
        data-testid={showCanvas ? 'starry-background-canvas' : 'starry-background-fallback'}
      />
      {children}
    </StarryBackgroundContext.Provider>
  )
}
