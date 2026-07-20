import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color } from 'three'
import type { Group } from 'three'
import { NebulaCloud } from './NebulaCloud'
import { StarField } from './StarField'
import { MeteorLayer } from './meteorLayer'
import { getDefaultNebulaParams } from './nebulaConfig'

interface NebulaBackgroundProps {
  particleCount: number
  isLight: boolean
  reducedMotion: boolean
  postProcessing: boolean
  pixelRatio: number
  mouseRef: { current: { x: number; y: number } }
  scrollProgress: number
  seed: number
}

export function NebulaBackground({
  particleCount,
  isLight,
  reducedMotion,
  postProcessing,
  pixelRatio,
  mouseRef,
  scrollProgress,
  seed,
}: NebulaBackgroundProps) {
  const { camera } = useThree()
  const groupRef = useRef<Group>(null)
  const rotationTargetRef = useRef({ x: 0, y: 0 })

  const params = useMemo(() => getDefaultNebulaParams(particleCount, isLight), [particleCount, isLight])

  const bgColor = useMemo(() => new Color(params.palette.background), [params.palette.background])

  useFrame(() => {
    if (reducedMotion) return

    const targetX = mouseRef.current.x * params.parallaxStrength - scrollProgress * params.scrollParallaxStrength
    const targetY =
      mouseRef.current.y * params.parallaxStrength * 0.6 + scrollProgress * params.scrollParallaxStrength * 0.3

    rotationTargetRef.current.x += (targetY - rotationTargetRef.current.x) * 0.045
    rotationTargetRef.current.y += (targetX - rotationTargetRef.current.y) * 0.045

    if (groupRef.current) {
      groupRef.current.rotation.x = -rotationTargetRef.current.x * 0.05
      groupRef.current.rotation.y = rotationTargetRef.current.y * 0.05
    }

    if (camera) {
      camera.position.x = rotationTargetRef.current.y * 0.6
      camera.position.y = rotationTargetRef.current.x * 0.4
      camera.lookAt(0, 0, 0)
    }
  })

  const meteorCount = postProcessing && !reducedMotion ? params.meteorCount : 0

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <group ref={groupRef}>
        <NebulaCloud params={params} reducedMotion={reducedMotion} />
        <StarField params={params} pixelRatio={pixelRatio} reducedMotion={reducedMotion} seed={seed} />
        {meteorCount > 0 && (
          <MeteorLayer
            count={meteorCount}
            spawnRate={params.meteorSpawnRate}
            color={params.palette.meteor}
            bounds={params.meteorBounds}
            speed={params.meteorSpeed}
          />
        )}
      </group>
    </>
  )
}
