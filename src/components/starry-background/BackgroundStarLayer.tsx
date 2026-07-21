import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from 'three'
import type { Points } from 'three'
import { backgroundStarFragmentShader, backgroundStarVertexShader } from './nebulaShaders'
import { generateBackgroundStars } from './starFieldGenerator'
import type { StarSystemParams } from './nebulaConfig'

interface BackgroundStarLayerProps {
  params: StarSystemParams
  pixelRatio: number
  reducedMotion: boolean
  seed: number
}

const BG_STAR_SIZE_SCALE = 260

export function BackgroundStarLayer({ params, pixelRatio, reducedMotion, seed }: BackgroundStarLayerProps) {
  const pointsRef = useRef<Points>(null)

  const { geometry, material } = useMemo(() => {
    const data = generateBackgroundStars(params, seed)
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(data.positions, 3))
    geo.setAttribute('aColor', new BufferAttribute(data.colors, 3))
    geo.setAttribute('aSize', new BufferAttribute(data.sizes, 1))
    geo.setAttribute('aPhase', new BufferAttribute(data.phases, 1))
    geo.setAttribute('aSpeed', new BufferAttribute(data.speeds, 1))
    geo.computeBoundingSphere()

    const mat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uTwinkleSpeed: { value: params.background.twinkleSpeed },
        uSizeScale: { value: BG_STAR_SIZE_SCALE },
      },
      vertexShader: backgroundStarVertexShader,
      fragmentShader: backgroundStarFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    return { geometry: geo, material: mat }
  }, [params, pixelRatio, seed])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((_, delta) => {
    if (reducedMotion) return
    material.uniforms.uTime.value += delta
    const points = pointsRef.current
    if (points) {
      points.rotation.y += delta * params.background.rotationSpeed
    }
  })

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}
