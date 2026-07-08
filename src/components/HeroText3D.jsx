import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Text3D, MeshTransmissionMaterial, useFont } from '@react-three/drei'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
import { vec3, float, uniform, mix, pow, clamp, dot, normalize, positionWorld, normalWorld, cameraPosition } from 'three/tsl'
import { useTheaterStore } from '../store/useTheaterStore'

const 字体路径 = '/fonts/helvetiker_bold.typeface.json'
useFont.preload(字体路径)

function 创建光晕精灵(color, size) {
  const c = new THREE.Color(color)
  const r = Math.round(c.r * 255)
  const g = Math.round(c.g * 255)
  const b = Math.round(c.b * 255)
  const sz = 256
  const canvas = document.createElement('canvas')
  canvas.width = sz
  canvas.height = sz
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2)
  grad.addColorStop(0, `rgba(${r},${g},${b},0.45)`)
  grad.addColorStop(0.25, `rgba(${r},${g},${b},0.18)`)
  grad.addColorStop(0.55, `rgba(${r},${g},${b},0.04)`)
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, sz, sz)
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(size, size, 1)
  return sprite
}

const 主色 = new THREE.Color('#e8f7ff')
const 边缘色 = new THREE.Color('#c07aff')
const 衰减色 = new THREE.Color('#00d9ff')
const 内部色 = new THREE.Color('#1a3a8a')

function 创建WebGPU玻璃材质() {
  const uTime = uniform(0)
  const uColor = uniform(主色)
  const uEdge = uniform(边缘色)

  const viewDir = normalize(cameraPosition.sub(positionWorld))
  const nDotV = clamp(dot(normalWorld, viewDir), 0, 1)
  const fresnel = pow(float(1).sub(nDotV), float(2.2))

  const hue = fresnel.add(uTime.mul(0.08))
  const rainbow = vec3(
    sin(hue.mul(6.28)).mul(0.5).add(0.75),
    sin(hue.mul(6.28).add(2.09)).mul(0.45).add(0.65),
    sin(hue.mul(6.28).add(4.18)).mul(0.6).add(0.8)
  )
  const emissive = mix(uColor, mix(uEdge, rainbow, fresnel), fresnel).mul(fresnel.mul(4.5).add(0.55))

  const mat = new MeshPhysicalNodeMaterial({
    color: uColor,
    transmission: 1,
    thickness: 1.6,
    roughness: 0.02,
    ior: 2.55,
    envMapIntensity: 9,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    attenuationColor: 衰减色,
    attenuationDistance: 0.95,
    transparent: true,
    metalness: 0.02,
  })
  mat.emissiveNode = emissive

  return { material: mat, uniforms: { uTime } }
}

function 创建WebGPU内部材质() {
  const uTime = uniform(0)
  const hue = uTime.mul(0.12)
  const rainbow = vec3(
    sin(hue.mul(6.28)).mul(0.35).add(0.85),
    sin(hue.mul(6.28).add(2.09)).mul(0.3).add(0.55),
    sin(hue.mul(6.28).add(4.18)).mul(0.5).add(0.9)
  )
  const mat = new MeshPhysicalNodeMaterial({
    color: 内部色,
    transmission: 0.3,
    thickness: 2.2,
    roughness: 0.18,
    ior: 1.75,
    envMapIntensity: 3,
    attenuationColor: 内部色,
    attenuationDistance: 1.6,
    emissive: 内部色,
    emissiveIntensity: 0.22,
    transparent: true,
  })
  mat.emissiveNode = rainbow.mul(0.25)
  return { material: mat, uniforms: { uTime } }
}

export default function HeroText3D() {
  const 网格引用 = useRef()
  const 内层引用 = useRef()
  const { gl } = useThree()
  const 是否WebGPU = gl.isWebGPURenderer === true

  const { material: 外层材质, uniforms: 外层Uniforms } = useMemo(
    () => (是否WebGPU ? 创建WebGPU玻璃材质() : { material: null, uniforms: {} }),
    [是否WebGPU]
  )
  const { material: 内层材质, uniforms: 内层Uniforms } = useMemo(
    () => (是否WebGPU ? 创建WebGPU内部材质() : { material: null, uniforms: {} }),
    [是否WebGPU]
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const 滚动进度 = useTheaterStore.getState().scrollProgress || 0
    if (网格引用.current) {
      网格引用.current.rotation.y = Math.sin(t * 0.12) * 0.08 + 滚动进度 * 0.35
      网格引用.current.position.y = Math.sin(t * 0.25) * 0.08 + 滚动进度 * 1.2
      const 缩放 = Math.max(0.5, 1 - 滚动进度 * 0.25)
      网格引用.current.scale.setScalar(缩放)
    }
    if (内层引用.current) {
      内层引用.current.rotation.y = Math.sin(t * 0.12) * 0.08 + 滚动进度 * 0.35
      内层引用.current.position.y = Math.sin(t * 0.25) * 0.08 + 滚动进度 * 1.2
      const 缩放 = Math.max(0.47, 1 - 滚动进度 * 0.25)
      内层引用.current.scale.setScalar(缩放 * 0.88)
    }
    if (是否WebGPU) {
      外层Uniforms.uTime.value = t
      内层Uniforms.uTime.value = t
    }
  })

  const 外层WebGL材质 = (
    <MeshTransmissionMaterial
      color={主色}
      transmission={1}
      thickness={1.6}
      roughness={0.02}
      ior={2.55}
      chromaticAberration={0.6}
      anisotropy={0.92}
      samples={32}
      backside
      backsideThickness={1.6}
      envMapIntensity={9}
      attenuationColor={衰减色}
      attenuationDistance={0.95}
    />
  )

  const 内层WebGL材质 = (
    <MeshTransmissionMaterial
      color={内部色}
      transmission={0.3}
      thickness={2.2}
      roughness={0.18}
      ior={1.75}
      chromaticAberration={0.15}
      samples={16}
      backside
      backsideThickness={2.2}
      envMapIntensity={3}
      attenuationColor={内部色}
      attenuationDistance={1.6}
    />
  )

  return (
    <group position={[0, 2.6, -2]}>
      <spotLight color="#7cbfff" intensity={8} distance={18} angle={Math.PI / 6} penumbra={0.6} position={[-3, 4, 3]} target-position={[0, 0, 0]} />
      <spotLight color="#b79aff" intensity={6} distance={18} angle={Math.PI / 6} penumbra={0.6} position={[3.5, 3, 2.5]} target-position={[0, 0, 0]} />
      <pointLight color="#5bb8ff" intensity={2.2} distance={10} decay={1.6} position={[-2, 1, 2]} />
      <pointLight color="#9d7cff" intensity={1.8} distance={10} decay={1.6} position={[2, -0.5, 2]} />
      <spotLight color="#7ce8ff" intensity={5} distance={16} angle={Math.PI / 5} penumbra={0.7} position={[0, -2, -4]} target-position={[0, 0, 0]} />
      <sprite position={[0, 0, -0.8]}>
        <primitive object={创建光晕精灵('#4fc3f7', 5.2)} />
      </sprite>
      <Text3D
        ref={网格引用}
        font={字体路径}
        size={0.65}
        height={0.28}
        curveSegments={5}
        bevelEnabled
        bevelThickness={0.03}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={6}
        letterSpacing={0.04}
        onUpdate={(self) => self.geometry.center()}
      >
        XUANRUIMU
        {是否WebGPU ? <primitive object={外层材质} attach="material" /> : 外层WebGL材质}
      </Text3D>
      <Text3D
        ref={内层引用}
        font={字体路径}
        size={0.65}
        height={0.22}
        curveSegments={4}
        bevelEnabled
        bevelThickness={0.022}
        bevelSize={0.014}
        bevelOffset={0}
        bevelSegments={4}
        letterSpacing={0.04}
        onUpdate={(self) => self.geometry.center()}
      >
        XUANRUIMU
        {是否WebGPU ? <primitive object={内层材质} attach="material" /> : 内层WebGL材质}
      </Text3D>
    </group>
  )
}
