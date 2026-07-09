import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color } from 'three'
import type { Group, WebGLRenderer } from 'three'
import { cn } from '../../lib/utils'
import { usePerformanceProfile } from '../../hooks/usePerformanceProfile'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { detectWebGPUSupport } from '../../utils/deviceCapabilities'
import { 生成星系数据 } from './skillGalaxyData'
import { SkillGalaxyFallback } from './SkillGalaxyFallback'
import type { QualitySettings } from '../../domain/types'

interface 星系场景属性 {
  画质设置: QualitySettings
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

async function createGalaxyRenderer(props: Record<string, unknown>): Promise<WebGLRenderer> {
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

function GalaxyScene({ 画质设置 }: 星系场景属性) {
  const groupRef = useRef<Group>(null)
  const { pointer } = useThree()
  const isLight = useIsLightTheme()
  const reducedMotion = useReducedMotion()

  const 数据 = useMemo(() => 生成星系数据(画质设置.particleCount), [画质设置.particleCount])

  const 背景几何 = useMemo(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(数据.背景粒子位置, 3))
    geometry.setAttribute('color', new BufferAttribute(数据.背景粒子颜色, 3))
    return geometry
  }, [数据])

  const 连线几何 = useMemo(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(数据.连线位置, 3))
    geometry.setAttribute('color', new BufferAttribute(数据.连线颜色, 3))
    return geometry
  }, [数据])

  useFrame((_state, delta) => {
    const group = groupRef.current
    if (!group || reducedMotion) return

    group.rotation.y += delta * 0.03
    group.rotation.x += (pointer.y * 0.08 - group.rotation.x) * 0.02
    group.rotation.z += (pointer.x * 0.04 - group.rotation.z) * 0.02
  })

  const 环境色 = isLight ? new Color('#f8f9fb') : new Color('#0b0c15')

  return (
    <group ref={groupRef}>
      <color attach="background" args={[环境色]} />
      <fog attach="fog" args={[环境色, 4, 18]} />

      <points geometry={背景几何}>
        <pointsMaterial
          size={isLight ? 0.025 : 0.035}
          vertexColors
          transparent
          opacity={isLight ? 0.5 : 0.85}
          blending={AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <lineSegments geometry={连线几何}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={isLight ? 0.18 : 0.35}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {数据.技能节点.map((节点) => (
        <mesh key={节点.编号} position={节点.位置}>
          <sphereGeometry args={[节点.大小, 16, 16]} />
          <meshBasicMaterial
            color={节点.颜色}
            transparent
            opacity={0.95}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

interface SkillGalaxyProps {
  className?: string
}

export function SkillGalaxy({ className }: SkillGalaxyProps) {
  const { settings, loading } = usePerformanceProfile()
  const reducedMotion = useReducedMotion()

  if (loading) {
    return (
      <div className={cn('absolute inset-0', className)}>
        <SkillGalaxyFallback />
      </div>
    )
  }

  return (
    <div className={cn('absolute inset-0', className)}>
      <Canvas
        className="!absolute inset-0"
        dpr={settings.dpr}
        gl={createGalaxyRenderer}
        fallback={<SkillGalaxyFallback />}
        frameloop={reducedMotion ? 'never' : 'always'}
        camera={{ position: [0, 0, 7], fov: 60, near: 0.1, far: 30 }}
      >
        <GalaxyScene 画质设置={settings} />
      </Canvas>
    </div>
  )
}
