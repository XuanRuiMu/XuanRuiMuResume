import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { usePerformanceProfile } from '../../hooks/usePerformanceProfile'
import { createStarryGalaxyScene, type StarryGalaxySceneApi } from './StarryGalaxyScene'
import { useIsDarkMode } from './useIsDarkMode'

interface StarryGalaxyBackgroundProps {
  className?: string
  children?: ReactNode
}

export function StarryGalaxyBackground({ className, children }: StarryGalaxyBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [, setApi] = useState<StarryGalaxySceneApi | null>(null)
  const { settings, loading } = usePerformanceProfile()
  const reducedMotion = useReducedMotion()
  const isDark = useIsDarkMode()

  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion || !isDark) return
    const container = containerRef.current
    if (!container) return

    const dpr = Array.isArray(settings.dpr) ? settings.dpr[0] : settings.dpr
    const scene = createStarryGalaxyScene(container, { dpr })
    setApi(scene)

    return () => {
      scene.destroy()
      setApi(null)
    }
  }, [settings, reducedMotion, isDark])

  const showCanvas = isDark && !loading && !reducedMotion

  return (
    <div
      ref={containerRef}
      className={cn('fixed inset-0 z-0', showCanvas ? '' : isDark ? 'bg-[#05060f]' : 'bg-transparent', className)}
      aria-hidden="true"
      data-testid={showCanvas ? 'starry-background-canvas' : 'starry-background-fallback'}
    >
      {children}
    </div>
  )
}
