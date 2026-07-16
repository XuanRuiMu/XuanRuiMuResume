import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from 'three'
import type { Points } from 'three'
import type { GalaxyParticleData } from './galaxyGenerator'
import { galaxyFragmentShader, galaxyVertexShader } from './galaxyShaders'

interface WebGLGalaxyProps {
  data: GalaxyParticleData
  pixelRatio: number
  rotationSpeed: number
  windStrength: number
  windRadius: number
  mouseRef: { current: { x: number; y: number } }
}

export function WebGLGalaxy({ data, pixelRatio, rotationSpeed, windStrength, windRadius, mouseRef }: WebGLGalaxyProps) {
  const pointsRef = useRef<Points>(null)

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: pixelRatio },
          uMouse: { value: [0, 0] },
          uWindStrength: { value: windStrength },
          uWindRadius: { value: windRadius },
        },
        vertexShader: galaxyVertexShader,
        fragmentShader: galaxyFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [pixelRatio, windStrength, windRadius]
  )

  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(data.positions, 3))
    geo.setAttribute('aColor', new BufferAttribute(data.colors, 3))
    geo.setAttribute('aSize', new BufferAttribute(data.sizes, 1))
    geo.setAttribute('aPhase', new BufferAttribute(data.phases, 1))
    geo.setAttribute('aOriginalPosition', new BufferAttribute(data.originalPositions, 3))
    return geo
  }, [data])

  useFrame((_, delta) => {
    const points = pointsRef.current
    if (!points) return

    material.uniforms.uTime.value += delta
    material.uniforms.uMouse.value[0] = mouseRef.current.x
    material.uniforms.uMouse.value[1] = mouseRef.current.y
    points.rotation.y += rotationSpeed * delta
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
