import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, Color, PlaneGeometry, ShaderMaterial } from 'three'
import type { Mesh } from 'three'
import { starCoreFragmentShader, starCoreVertexShader } from './galaxyShaders'
import type { StarSystemParams } from './nebulaConfig'

interface StarCoreLayerProps {
  params: StarSystemParams
  reducedMotion: boolean
}

export function StarCoreLayer({ params, reducedMotion }: StarCoreLayerProps) {
  const meshRef = useRef<Mesh>(null)
  const { camera } = useThree()

  const { geometry, material } = useMemo(() => {
    const geo = new PlaneGeometry(1, 1)
    const palette = params.palette
    const core = params.core
    const mat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCoreColor: { value: new Color(palette.coreColor) },
        uGlowColor: { value: new Color(palette.coreGlow) },
        uIntensity: { value: core.intensity },
        uPulseSpeed: { value: core.pulseSpeed },
        uGlowFalloff: { value: core.glowFalloff },
      },
      vertexShader: starCoreVertexShader,
      fragmentShader: starCoreFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
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
    if (!reducedMotion) {
      material.uniforms.uTime.value += delta
    }
    const mesh = meshRef.current
    if (mesh && camera) {
      mesh.lookAt(camera.position)
    }
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} scale={[params.core.size, params.core.size, 1]} />
}
