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
  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const { pointer, camera } = useThree()
  const isLight = useIsLightTheme()
  const reducedMotion = useReducedMotion()
  const scrollProgress = useScrollProgress()

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

    const 旋转速度 = delta * 0.05
    const 鼠标幅度X = pointer.y * 0.18
    const 鼠标幅度Y = pointer.x * 0.12
    const 滚动偏移 = scrollProgress * Math.PI * 0.25

    group.rotation.y += 旋转速度
    group.rotation.x += (鼠标幅度X - group.rotation.x + 滚动偏移 * 0.3) * 0.03
    group.rotation.z += (鼠标幅度Y - group.rotation.z + 滚动偏移 * 0.2) * 0.03

    const targetCameraX = pointer.x * 0.8 - scrollProgress * 1.2
    const targetCameraY = pointer.y * 0.5 + scrollProgress * 0.6
    cameraRef.current.x += (targetCameraX - cameraRef.current.x) * 0.04
    cameraRef.current.y += (targetCameraY - cameraRef.current.y) * 0.04
    camera.position.x = cameraRef.current.x
    camera.position.y = cameraRef.current.y
  })

  const 环境色 = isLight ? new Color('#f8f9fb') : new Color('#0b0c15')

  return (
    <group ref={groupRef}>
      <color attach="background" args={[环境色]} />
      <fog attach="fog" args={[环境色, 4, 22]} />

      <points geometry={背景几何}>
        <pointsMaterial
          size={isLight ? 0.025 : 0.038}
          vertexColors
          transparent
          opacity={isLight ? 0.5 : 0.9}
          blending={AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <lineSegments geometry={连线几何}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={isLight ? 0.18 : 0.4}
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
  fixed?: boolean
}

export function SkillGalaxy({ className, fixed = false }: SkillGalaxyProps) {
  const { settings, loading } = usePerformanceProfile()
  const reducedMotion = useReducedMotion()

  const 容器类名 = cn(fixed ? 'fixed inset-0' : 'absolute inset-0', 'pointer-events-none', className)

  if (loading) {
    return (
      <div className={容器类名} style={{ willChange: 'transform' }}>
        <SkillGalaxyFallback />
      </div>
    )
  }

  return (
    <div className={容器类名} style={{ willChange: 'transform' }}>
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
