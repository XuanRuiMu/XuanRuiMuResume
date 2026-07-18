import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { cn } from '../../lib/utils'
import { usePerformanceProfile } from '../../hooks/usePerformanceProfile'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { SkillGalaxyFallback } from '../skill-galaxy/SkillGalaxyFallback'
import { NebulaBackground } from './NebulaBackground'

const STAR_FIELD_SEED = 20260718

function useIsLightTheme(): boolean {
  const [isLight, setIsLight] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('light')
  )

  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    setIsLight(root.classList.contains('light'))

    const observer = new MutationObserver(() => {
      setIsLight(root.classList.contains('light'))
    })
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  return isLight
}

function useScrollProgress(): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      setProgress(window.scrollY / maxScroll)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return progress
}

interface StarryBackgroundProps {
  className?: string
}

export function StarryBackground({ className }: StarryBackgroundProps) {
  const { settings, loading } = usePerformanceProfile()
  const reducedMotion = useReducedMotion()
  const isLight = useIsLightTheme()
  const scrollProgress = useScrollProgress()
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion) return

    const handlePointerMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -((e.clientY / window.innerHeight) * 2 - 1)
      mouseRef.current.x = x
      mouseRef.current.y = y
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [reducedMotion])

  const dprValue = useMemo(() => {
    if (Array.isArray(settings.dpr)) return settings.dpr[0]
    return settings.dpr
  }, [settings.dpr])

  const containerClassName = cn('fixed inset-0 pointer-events-none', className)

  if (loading) {
    return (
      <div className={containerClassName} style={{ willChange: 'transform' }}>
        <SkillGalaxyFallback />
      </div>
    )
  }

  return (
    <div className={containerClassName} style={{ willChange: 'transform' }}>
      <Canvas
        className="!absolute inset-0"
        dpr={settings.dpr}
        fallback={<SkillGalaxyFallback />}
        frameloop={reducedMotion ? 'never' : 'always'}
        camera={{ position: [0, 0, 30], fov: 55, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <NebulaBackground
          particleCount={settings.particleCount}
          isLight={isLight}
          reducedMotion={reducedMotion}
          postProcessing={settings.postProcessing}
          pixelRatio={dprValue}
          mouseRef={mouseRef}
          scrollProgress={scrollProgress}
          seed={STAR_FIELD_SEED}
        />
      </Canvas>
    </div>
  )
}
