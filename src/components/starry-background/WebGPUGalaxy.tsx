import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry } from 'three'
import type { Points } from 'three'
import * as THREE from 'three/webgpu'
import {
  add,
  atan,
  attribute,
  clamp,
  color,
  div,
  exp,
  float,
  length,
  log,
  mix,
  mod,
  mul,
  normalize,
  sin,
  smoothstep,
  sub,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl'
import type { GalaxyPalette } from './galaxyConfig'
import type { GalaxyParticleData } from './galaxyGenerator'

interface WebGPUGalaxyProps {
  data: GalaxyParticleData
  rotationSpeed: number
  windStrength: number
  windRadius: number
  palette: GalaxyPalette
  arms: number
  tightness: number
  intensity: number
  sizeMultiplier: number
  mouseRef: { current: { x: number; y: number } }
}

function createGalaxyNodeMaterial(
  palette: GalaxyPalette,
  windStrength: number,
  windRadius: number,
  arms: number,
  tightness: number,
  intensity: number,
  sizeMultiplier: number
) {
  const uTime = uniform(float(0))
  const uMouse = uniform(vec2(0, 0))
  const uWindStrength = uniform(float(windStrength))
  const uWindRadius = uniform(float(windRadius))

  const centerColor = color(palette.center)
  const armColor = color(palette.arm)
  const edgeColor = color(palette.edge)

  const pos = attribute('aOriginalPosition', 'vec3')
  const phase = attribute('aPhase', 'float')

  const r = length(pos.xz)
  const normalizedR = clamp(div(sub(r, float(2)), float(20)), float(0), float(1))

  const c1 = mix(centerColor, armColor, clamp(mul(normalizedR, float(2)), float(0), float(1)))
  const c2 = mix(c1, edgeColor, clamp(div(sub(normalizedR, float(0.4)), float(0.6)), float(0), float(1)))

  const angle = atan(pos.z, pos.x)
  const armsNode = float(arms)
  const spiral = sin(add(mul(armsNode, angle), mul(log(add(r, float(1))), float(tightness))))
  const armMask = smoothstep(float(-0.3), float(0.3), spiral)
  const brightness = mix(float(0.4), float(1), armMask)

  const finalColor = mul(mul(c2, brightness), float(intensity))

  const cameraZ = float(8)
  const fovScale = float(0.577)
  const mouseWorld = mul(uMouse, mul(cameraZ, fovScale))

  const dir = sub(pos.xz, mouseWorld)
  const dist = length(dir)
  const falloff = smoothstep(mul(uWindRadius, float(8)), float(0), dist)

  const t = add(mul(uTime, float(3)), phase)
  const cycle = mod(t, float(3))
  const spring = mul(sin(mul(cycle, float(8))), exp(mul(cycle, float(-1.8))))

  const wave = mul(sin(sub(mul(dist, float(3)), mul(uTime, float(5)))), exp(mul(dist, float(-0.4))))

  const pushDir = normalize(add(dir, vec2(0.0001, 0.0001)))
  const displacement = mul(
    pushDir,
    add(
      add(mul(falloff, uWindStrength), mul(mul(sub(float(1), falloff), spring), mul(uWindStrength, float(0.2)))),
      mul(wave, mul(uWindStrength, float(0.25)))
    )
  )

  const displacedPos = add(pos, vec3(displacement.x, float(0), displacement.y))

  const material = new THREE.PointsNodeMaterial({
    positionNode: displacedPos as never,
    colorNode: vec4(finalColor, float(1)) as never,
    size: 2 * sizeMultiplier,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })

  return { material, uniforms: { uTime, uMouse, uWindStrength, uWindRadius } }
}

export function WebGPUGalaxy({
  data,
  rotationSpeed,
  windStrength,
  windRadius,
  palette,
  arms,
  tightness,
  intensity,
  sizeMultiplier,
  mouseRef,
}: WebGPUGalaxyProps) {
  const pointsRef = useRef<Points>(null)

  const { material, uniforms } = useMemo(
    () => createGalaxyNodeMaterial(palette, windStrength, windRadius, arms, tightness, intensity, sizeMultiplier),
    [palette, windStrength, windRadius, arms, tightness, intensity, sizeMultiplier]
  )

  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(data.positions, 3))
    geo.setAttribute('aOriginalPosition', new BufferAttribute(data.originalPositions, 3))
    geo.setAttribute('aPhase', new BufferAttribute(data.phases, 1))
    return geo
  }, [data])

  useFrame((_, delta) => {
    const points = pointsRef.current
    if (!points) return

    ;(uniforms.uTime.value as number) += delta
    const mouseValue = uniforms.uMouse.value as { set: (x: number, y: number) => void }
    mouseValue.set(mouseRef.current.x, mouseRef.current.y)

    points.rotation.y += rotationSpeed * delta
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}

export default WebGPUGalaxy
