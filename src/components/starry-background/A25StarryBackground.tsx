import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { usePerformanceProfile } from '../../hooks/usePerformanceProfile'
import { createA25StarryScene, type A25StarrySceneApi } from './A25StarryScene'
import { StarryBackgroundContext } from './StarryBackgroundContext'

interface A25StarryBackgroundProps {
  className?: string
}

export function A25StarryBackground({ className }: A25StarryBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<A25StarrySceneApi | null>(null)
  const [api, setApi] = useState<A25StarrySceneApi | null>(null)
  const { settings, loading } = usePerformanceProfile()
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion) return
    const container = containerRef.current
    if (!container) return

    const dpr = Array.isArray(settings.dpr) ? settings.dpr[0] : settings.dpr
    const scene = createA25StarryScene(container, {
      particleCount: settings.particleCount,
      dpr,
      rotationSpeed: 0.1,
      breathEnabled: true,
    })
    sceneRef.current = scene
    setApi(scene)

    return () => {
      scene.destroy()
      sceneRef.current = null
      setApi(null)
    }
  }, [settings, reducedMotion])

  if (loading || reducedMotion) {
    return (
      <div
        className={cn('fixed inset-0 -z-20 bg-[#05060f]', className)}
        aria-hidden="true"
        data-testid="starry-background-fallback"
      />
    )
  }

  return (
    <StarryBackgroundContext.Provider value={api}>
      <div
        ref={containerRef}
        className={cn('fixed inset-0 -z-20', className)}
        aria-hidden="true"
        data-testid="starry-background-canvas"
      />
    </StarryBackgroundContext.Provider>
  )
}
