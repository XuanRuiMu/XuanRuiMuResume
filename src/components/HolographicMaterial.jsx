import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
import {
  vec3,
  float,
  uniform,
  mix,
  smoothstep,
  sin,
  pow,
  clamp,
  dot,
  normalize,
  positionWorld,
  normalWorld,
  cameraPosition,
} from 'three/tsl'

const 默认配置 = {
  metalness: 0.75,
  roughness: 0.2,
  clearcoat: 0.6,
  clearcoatRoughness: 0.1,
  iridescence: 1,
  iridescenceIOR: 1.33,
  iridescenceThicknessRange: [100, 400],
  sheen: 0.35,
  sheenRoughness: 0.4,
  envMapIntensity: 1.3,
  baseIntensity: 0.4,
  hoverBoost: 1.0,
  fresnelPower: 2.4,
  scanFreq: 24,
  scanSpeed: 1.5,
}

function 创建WebGPU材质(color, baseColor, 配置) {
  const uTime = uniform(0)
  const uHover = uniform(0)
  const uColor = uniform(new THREE.Color(color))

  const viewDir = normalize(cameraPosition.sub(positionWorld))
  const nDotV = clamp(dot(normalWorld, viewDir), 0, 1)
  const fresnel = pow(float(1).sub(nDotV), float(配置.fresnelPower))

  const hue = fresnel.add(uTime.mul(0.1)).add(uHover.mul(0.25))
  const rainbow = vec3(
    sin(hue.mul(6.28)).mul(0.5).add(0.5),
    sin(hue.mul(6.28).add(2.09)).mul(0.5).add(0.5),
    sin(hue.mul(6.28).add(4.18)).mul(0.5).add(0.5)
  )
  const edgeColor = mix(uColor, rainbow, fresnel.mul(0.7))

  const scan = sin(positionWorld.y.mul(配置.scanFreq).add(uTime.mul(配置.scanSpeed)))
    .mul(0.5)
    .add(0.5)
  const scanMask = smoothstep(0.35, 0.65, scan).mul(0.12).mul(float(1).add(uHover))

  const baseEmissive = uColor.mul(float(配置.baseIntensity).add(uHover.mul(配置.hoverBoost)))
  const emissive = baseEmissive.add(
    edgeColor.mul(fresnel.mul(0.9).add(scanMask)).mul(float(1).add(uHover.mul(0.8)))
  )

  const mat = new MeshPhysicalNodeMaterial({
    color: baseColor,
    metalness: 配置.metalness,
    roughness: 配置.roughness,
    clearcoat: 配置.clearcoat,
    clearcoatRoughness: 配置.clearcoatRoughness,
    iridescence: 配置.iridescence,
    iridescenceIOR: 配置.iridescenceIOR,
    iridescenceThicknessRange: 配置.iridescenceThicknessRange,
    sheen: 配置.sheen,
    sheenRoughness: 配置.sheenRoughness,
    sheenColor: color,
    envMapIntensity: 配置.envMapIntensity,
  })
  mat.emissiveNode = emissive

  return { material: mat, uniforms: { uTime, uHover } }
}

function 创建WebGL材质(color, baseColor, 配置) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: baseColor,
    emissive: color,
    emissiveIntensity: 配置.baseIntensity,
    metalness: 配置.metalness,
    roughness: 配置.roughness,
    clearcoat: 配置.clearcoat,
    clearcoatRoughness: 配置.clearcoatRoughness,
    iridescence: 配置.iridescence,
    iridescenceIOR: 配置.iridescenceIOR,
    iridescenceThicknessRange: 配置.iridescenceThicknessRange,
    sheen: 配置.sheen,
    sheenRoughness: 配置.sheenRoughness,
    sheenColor: color,
    envMapIntensity: 配置.envMapIntensity,
  })
  return { material: mat, uniforms: {} }
}

export function HolographicMaterial({
  color,
  baseColor,
  hovered,
  metalness = 默认配置.metalness,
  roughness = 默认配置.roughness,
  clearcoat = 默认配置.clearcoat,
  clearcoatRoughness = 默认配置.clearcoatRoughness,
  iridescence = 默认配置.iridescence,
  iridescenceIOR = 默认配置.iridescenceIOR,
  iridescenceThicknessRange = 默认配置.iridescenceThicknessRange,
  sheen = 默认配置.sheen,
  sheenRoughness = 默认配置.sheenRoughness,
  envMapIntensity = 默认配置.envMapIntensity,
  baseIntensity = 默认配置.baseIntensity,
  hoverBoost = 默认配置.hoverBoost,
  fresnelPower = 默认配置.fresnelPower,
  scanFreq = 默认配置.scanFreq,
  scanSpeed = 默认配置.scanSpeed,
}) {
  const { gl } = useThree()
  const 是否WebGPU = gl.isWebGPURenderer === true
  const 配置 = useMemo(
    () => ({
      metalness,
      roughness,
      clearcoat,
      clearcoatRoughness,
      iridescence,
      iridescenceIOR,
      iridescenceThicknessRange,
      sheen,
      sheenRoughness,
      envMapIntensity,
      baseIntensity,
      hoverBoost,
      fresnelPower,
      scanFreq,
      scanSpeed,
    }),
    [
      metalness,
      roughness,
      clearcoat,
      clearcoatRoughness,
      iridescence,
      iridescenceIOR,
      iridescenceThicknessRange,
      sheen,
      sheenRoughness,
      envMapIntensity,
      baseIntensity,
      hoverBoost,
      fresnelPower,
      scanFreq,
      scanSpeed,
    ]
  )

  const { material, uniforms } = useMemo(
    () => (是否WebGPU ? 创建WebGPU材质(color, baseColor, 配置) : 创建WebGL材质(color, baseColor, 配置)),
    [是否WebGPU, color, baseColor, 配置]
  )

  const hoverRef = useRef(0)

  useFrame((state, delta) => {
    const target = hovered ? 1 : 0
    hoverRef.current += (target - hoverRef.current) * Math.min(delta * 8, 1)

    if (是否WebGPU) {
      uniforms.uHover.value = hoverRef.current
      uniforms.uTime.value = state.clock.elapsedTime
    } else {
      material.emissiveIntensity = 配置.baseIntensity + hoverRef.current * 配置.hoverBoost
    }
  })

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  return <primitive object={material} attach="material" />
}
