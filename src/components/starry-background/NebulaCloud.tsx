import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, Color, ShaderMaterial, SphereGeometry } from 'three'
import type { Mesh } from 'three'
import { nebulaFragmentShader, nebulaVertexShader } from './nebulaShaders'
import type { NebulaParams } from './nebulaConfig'

interface NebulaCloudProps {
  params: NebulaParams
  reducedMotion: boolean
}

export function NebulaCloud({ params, reducedMotion }: NebulaCloudProps) {
  const meshRef = useRef<Mesh>(null)

  const { geometry, material } = useMemo(() => {
    const geo = new SphereGeometry(params.nebulaRadius, 64, 32)
    const palette = params.palette
    const mat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uNebulaA: { value: new Color(palette.nebulaA) },
        uNebulaB: { value: new Color(palette.nebulaB) },
        uNebulaC: { value: new Color(palette.nebulaC) },
        uIntensity: { value: params.nebulaIntensity },
      },
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      side: BackSide,
      transparent: true,
      depthWrite: false,
    })
    return { geometry: geo, material: mat }
  }, [params])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((_, delta) => {
    if (reducedMotion) return
    material.uniforms.uTime.value += delta
    const mesh = meshRef.current
    if (mesh) {
      mesh.rotation.y += delta * params.rotationSpeed * 0.05
    }
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} />
}
