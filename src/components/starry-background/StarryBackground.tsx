import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from 'three'
import type { Group, WebGLRenderer } from 'three'
import { cn } from '../../lib/utils'
import { usePerformanceProfile } from '../../hooks/usePerformanceProfile'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { detectWebGPUSupport } from '../../utils/deviceCapabilities'
import { SkillGalaxyFallback } from '../skill-galaxy/SkillGalaxyFallback'
import type { QualitySettings } from '../../domain/types'
import { getDefaultGalaxyParams } from './galaxyConfig'
import { generateSpiralGalaxy } from './galaxyGenerator'
import { WebGLGalaxy } from './WebGLGalaxy'

const WebGPUGalaxy = lazy(() => import('./WebGPUGalaxy'))

interface StarryBackgroundSceneProps {
  qualitySettings: QualitySettings
  useWebGPU: boolean
}

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

interface Meteor {
  positions: Float32Array
  velocity: [number, number, number]
  life: number
  maxLife: number
  active: boolean
}

function createMeteor(): Meteor {
  const y = 3 + Math.random() * 6
  const x = -12 - Math.random() * 8
  const z = -2 - Math.random() * 4
  const speed = 8 + Math.random() * 8
  const angle = -Math.PI / 6 + (Math.random() - 0.5) * 0.3

  return {
    positions: new Float32Array([x, y, z, x - 0.3, y + 0.15, z]),
    velocity: [speed * Math.cos(angle), -speed * Math.sin(angle), 0],
    life: 0,
    maxLife: 1.2 + Math.random() * 0.8,
    active: false,
  }
}

function MeteorLayer({ count }: { count: number }) {
  const meteorsRef = useRef<Meteor[]>([])
  const { geometry, material } = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array(count * 6), 3))
    geo.setAttribute('aAlpha', new BufferAttribute(new Float32Array(count * 2), 1))
    geo.setDrawRange(0, 0)

    const mat = new ShaderMaterial({
      uniforms: {
        uColor: { value: new Color('#e6f7ff') },
      },
      vertexShader: `
        attribute float aAlpha;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(uColor, vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })

    return { geometry: geo, material: mat }
  }, [count])

  useEffect(() => {
    meteorsRef.current = Array.from({ length: count }, createMeteor)
  }, [count])

  useFrame((_, delta) => {
    if (meteorsRef.current.length === 0) return

    let activeCount = 0
    const positionAttr = geometry.getAttribute('position') as BufferAttribute
    const alphaAttr = geometry.getAttribute('aAlpha') as BufferAttribute
    const positionArray = positionAttr.array as Float32Array
    const alphaArray = alphaAttr.array as Float32Array

    meteorsRef.current.forEach((meteor) => {
      if (!meteor.active) {
        if (Math.random() < delta * 0.08) {
          meteor.active = true
          meteor.life = 0
          const fresh = createMeteor()
          meteor.positions = fresh.positions
          meteor.velocity = fresh.velocity
        }
        return
      }

      meteor.life += delta
      const progress = meteor.life / meteor.maxLife

      if (progress >= 1) {
        meteor.active = false
        return
      }

      const x = meteor.positions[0] + meteor.velocity[0] * delta
      const y = meteor.positions[1] + meteor.velocity[1] * delta
      const z = meteor.positions[2] + meteor.velocity[2] * delta

      meteor.positions[0] = x
      meteor.positions[1] = y
      meteor.positions[2] = z
      meteor.positions[3] = x - meteor.velocity[0] * 0.04
      meteor.positions[4] = y - meteor.velocity[1] * 0.04
      meteor.positions[5] = z - meteor.velocity[2] * 0.04

      const alpha = Math.sin(progress * Math.PI) * 1.0
      const index = activeCount * 6
      positionArray[index] = meteor.positions[0]
      positionArray[index + 1] = meteor.positions[1]
      positionArray[index + 2] = meteor.positions[2]
      positionArray[index + 3] = meteor.positions[3]
      positionArray[index + 4] = meteor.positions[4]
      positionArray[index + 5] = meteor.positions[5]
      alphaArray[activeCount * 2] = alpha
      alphaArray[activeCount * 2 + 1] = alpha * 0.4

      activeCount += 1
    })

    positionAttr.needsUpdate = true
    alphaAttr.needsUpdate = true
    geometry.setDrawRange(0, activeCount * 2)
  })

  return <lineSegments geometry={geometry} material={material} />
}

async function createWebGPUAwareRenderer(props: Record<string, unknown>): Promise<WebGLRenderer> {
  const supportsWebGPU = await detectWebGPUSupport()

  if (supportsWebGPU) {
    try {
      const { WebGPURenderer } = await import('three/webgpu')
      const renderer = new WebGPURenderer({ ...props, antialias: true })
      await renderer.init()
      return renderer as unknown as WebGLRenderer
    } catch {
      // 降级到 WebGL
    }
  }

  const { WebGLRenderer: FallbackRenderer } = await import('three')
  return new FallbackRenderer({ ...props, antialias: true })
}

function StarryBackgroundScene({ qualitySettings, useWebGPU }: StarryBackgroundSceneProps) {
  const isLight = useIsLightTheme()
  const reducedMotion = useReducedMotion()
  const scrollProgress = useScrollProgress()
  const cameraRef = useRef({ x: 0, y: 0 })
  const groupRef = useRef<Group>(null)
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
    if (Array.isArray(qualitySettings.dpr)) return qualitySettings.dpr[0]
    return qualitySettings.dpr
  }, [qualitySettings.dpr])

  const galaxyParams = useMemo(
    () => getDefaultGalaxyParams(qualitySettings.particleCount, isLight),
    [qualitySettings.particleCount, isLight]
  )

  const galaxyData = useMemo(
    () => generateSpiralGalaxy(qualitySettings.particleCount, galaxyParams, 31),
    [galaxyParams, qualitySettings.particleCount]
  )

  const wind = reducedMotion ? { strength: 0, radius: 0.4 } : { strength: 0.35, radius: 0.4 }
  const galaxyRotationSpeed = reducedMotion ? 0 : galaxyParams.rotationSpeed

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || reducedMotion) return

    const targetCameraX = mouseRef.current.x * 0.6 - scrollProgress * 0.5
    const targetCameraY = mouseRef.current.y * 0.4 + scrollProgress * 0.3

    cameraRef.current.x += (targetCameraX - cameraRef.current.x) * 0.04
    cameraRef.current.y += (targetCameraY - cameraRef.current.y) * 0.04

    group.rotation.z += delta * 0.008
    group.rotation.x = cameraRef.current.y * 0.08
    group.rotation.y = cameraRef.current.x * 0.08
  })

  const environmentColor = isLight ? new Color('#f8f9fb') : new Color('#0b0c15')
  const meteorCount = qualitySettings.postProcessing ? 5 : 0

  return (
    <group ref={groupRef}>
      <color attach="background" args={[environmentColor]} />

      {useWebGPU ? (
        <Suspense fallback={null}>
          <WebGPUGalaxy
            data={galaxyData}
            rotationSpeed={galaxyRotationSpeed}
            windStrength={wind.strength}
            windRadius={wind.radius}
            palette={galaxyParams.palette}
            arms={galaxyParams.arms}
            tightness={galaxyParams.tightness}
            intensity={galaxyParams.intensity}
            sizeMultiplier={galaxyParams.sizeMultiplier}
            mouseRef={mouseRef}
          />
        </Suspense>
      ) : (
        <WebGLGalaxy
          data={galaxyData}
          pixelRatio={dprValue}
          rotationSpeed={galaxyRotationSpeed}
          windStrength={wind.strength}
          windRadius={wind.radius}
          intensity={galaxyParams.intensity}
          mouseRef={mouseRef}
        />
      )}

      {meteorCount > 0 && <MeteorLayer count={meteorCount} />}
    </group>
  )
}

interface StarryBackgroundProps {
  className?: string
}

export function StarryBackground({ className }: StarryBackgroundProps) {
  const { settings, loading } = usePerformanceProfile()
  const reducedMotion = useReducedMotion()
  const [useWebGPU, setUseWebGPU] = useState(false)
  const [rendererReady, setRendererReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    detectWebGPUSupport()
      .then((supported) => {
        if (!cancelled) setUseWebGPU(supported)
      })
      .catch(() => {
        if (!cancelled) setUseWebGPU(false)
      })
      .finally(() => {
        if (!cancelled) setRendererReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const containerClassName = cn('fixed inset-0 pointer-events-none', className)

  if (loading || !rendererReady) {
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
        gl={createWebGPUAwareRenderer}
        fallback={<SkillGalaxyFallback />}
        frameloop={reducedMotion ? 'never' : 'always'}
        camera={{ position: [0, 0, 14], fov: 60, near: 0.1, far: 40 }}
      >
        <StarryBackgroundScene qualitySettings={settings} useWebGPU={useWebGPU} />
      </Canvas>
    </div>
  )
}
