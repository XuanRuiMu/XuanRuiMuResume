import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BackSide, Color, Matrix4, ShaderMaterial, SphereGeometry } from 'three'
import type { Mesh } from 'three'
import { nebulaVolumeFragmentShader, nebulaVolumeVertexShader } from './galaxyShaders'
import type { StarSystemParams } from './nebulaConfig'

interface NebulaCloudProps {
  params: StarSystemParams
  reducedMotion: boolean
}

export function NebulaCloud({ params, reducedMotion }: NebulaCloudProps) {
  const meshRef = useRef<Mesh>(null)
  const inverseModelMatrix = useMemo(() => new Matrix4(), [])

  const { geometry, material } = useMemo(() => {
    const geo = new SphereGeometry(1, 48, 24)
    const palette = params.palette
    const spiral = params.spiral
    const nebula = params.nebula
    const mat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorCore: { value: new Color(palette.nebulaCore) },
        uColorMid: { value: new Color(palette.nebulaMid) },
        uColorEdge: { value: new Color(palette.nebulaEdge) },
        uIntensity: { value: nebula.intensity },
        uArmCount: { value: spiral.armCount },
        uArmTightness: { value: spiral.armTightness },
        uDiscThickness: { value: spiral.discThickness },
        uGalaxyRadius: { value: spiral.galaxyRadius },
        uSphereRadius: { value: nebula.sphereRadius },
        uStepCount: { value: nebula.stepCount },
        uFbmOctaves: { value: nebula.fbmOctaves },
        uTurbulenceScale: { value: nebula.turbulenceScale },
        uTurbulenceSpeed: { value: nebula.turbulenceSpeed },
        uInverseModelMatrix: { value: inverseModelMatrix },
      },
      vertexShader: nebulaVolumeVertexShader,
      fragmentShader: nebulaVolumeFragmentShader,
      side: BackSide,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    return { geometry: geo, material: mat }
  }, [params, inverseModelMatrix])

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
      mesh.rotation.y += delta * params.nebula.rotationSpeed
      mesh.updateMatrixWorld(true)
      inverseModelMatrix.copy(mesh.matrixWorld).invert()
    }
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      scale={[params.nebula.sphereRadius, params.nebula.sphereRadius, params.nebula.sphereRadius]}
    />
  )
}
