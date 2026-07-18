import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from 'three'
import type { Points } from 'three'
import { starFragmentShader, starVertexShader } from './nebulaShaders'
import { generateStarField } from './starFieldGenerator'
import type { NebulaParams } from './nebulaConfig'

interface StarFieldProps {
  params: NebulaParams
  pixelRatio: number
  reducedMotion: boolean
  seed: number
}

export function StarField({ params, pixelRatio, reducedMotion, seed }: StarFieldProps) {
  const pointsRef = useRef<Points>(null)

  const { geometry, material } = useMemo(() => {
    const data = generateStarField(params.particleCount, params, seed)
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(data.positions, 3))
    geo.setAttribute('aColor', new BufferAttribute(data.colors, 3))
    geo.setAttribute('aSize', new BufferAttribute(data.sizes, 1))
    geo.setAttribute('aPhase', new BufferAttribute(data.phases, 1))
    geo.setAttribute('aSpeed', new BufferAttribute(data.speeds, 1))

    const mat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uTwinkleSpeed: { value: params.twinkleSpeed },
      },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
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
      points.rotation.y += delta * params.rotationSpeed * 0.02
    }
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
