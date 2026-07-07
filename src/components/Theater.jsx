import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { NodeMaterial } from 'three/webgpu'
import { vec3, float, uniform, smoothstep, uv } from 'three/tsl'
import { Grid, useGLTF } from '@react-three/drei'

import { Entities } from './Entities'
import { CameraController } from './CameraController'
import { FloatingBoard } from './FloatingBoard'
import { GalaxyBackground } from './GalaxyBackground'
import { SpaceStation, FarStation } from './SpaceStation'
import 玻璃文字标题 from './HeroText3D'
import { PostProcessingStack } from './PostProcessingStack'
import { InstancedParticles } from './InstancedParticles'
import { EnvironmentProbe } from './EnvironmentProbe'
import { SECTION_META } from '../store/useTheaterStore'

const 创建渲染器 = async (props) => {
  if (typeof navigator !== 'undefined' && navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter()
      if (!adapter) throw new Error('WebGPU adapter not available')
    } catch {
      return new THREE.WebGLRenderer({ ...props, antialias: true, alpha: false, powerPreference: 'high-performance' })
    }
  }

  try {
    const { WebGPURenderer } = await import('three/webgpu')
    const renderer = new WebGPURenderer({ ...props, antialias: true, alpha: false, powerPreference: 'high-performance' })
    await renderer.init()
    return renderer
  } catch (err) {
    console.warn('WebGPU 初始化失败，回退到 WebGLRenderer：', err)
    return new THREE.WebGLRenderer({ ...props, antialias: true, alpha: false, powerPreference: 'high-performance' })
  }
}

useGLTF.preload('/models/5TxCebwK2h.glb')
useGLTF.preload('/models/emG0dq38D8f.glb')

const SECTION_ORDER = ['it', 'edu', 'design', 'music', 'media']

function ArchiveRings() {
  const groupRef = useRef()
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.015
    }
  })

  return (
    <group ref={groupRef} position={[0, -2.2, 0]}>
      {[5, 7, 9].map((radius, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.04, radius, 128]} />
          <meshBasicMaterial color="#2a3a55" transparent opacity={0.35 - i * 0.08} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

function VolumetricCone({ position, color }) {
  const { gl } = useThree()
  const 是否WebGPU = gl.isWebGPURenderer === true

  const material = useMemo(() => {
    if (是否WebGPU) {
      const uColor = uniform(new THREE.Color(color))
      const uOpacity = uniform(0.08)
      const vUv = uv()
      const falloff = smoothstep(0, 0.25, vUv.y).mul(float(1).sub(vUv.y))

      const mat = new NodeMaterial()
      mat.colorNode = vec3(uColor)
      mat.opacityNode = falloff.mul(uOpacity)
      mat.transparent = true
      mat.depthWrite = false
      mat.side = THREE.DoubleSide
      return mat
    }

    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: 0.08 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          float falloff = smoothstep(0.0, 0.25, vUv.y) * (1.0 - vUv.y);
          gl_FragColor = vec4(uColor, falloff * uOpacity);
        }
      `,
    })
  }, [color, 是否WebGPU])

  return (
    <mesh position={position} material={material} rotation={[Math.PI, 0, 0]}>
      <cylinderGeometry args={[2.6, 0.08, 10, 32, 1, true]} />
    </mesh>
  )
}

function EntitySpotlights() {
  return (
    <group>
      {SECTION_ORDER.map((section, i) => {
        const angle = (i * 72 - 90) * (Math.PI / 180)
        const x = Math.cos(angle) * 3.6
        const z = Math.sin(angle) * 3.6
        return <VolumetricCone key={section} position={[x, 9, z]} color={SECTION_META[section].color} />
      })}
    </group>
  )
}

function ArchiveGrid() {
  return (
    <Grid
      position={[0, -2.21, 0]}
      args={[60, 60]}
      cellSize={0.8}
      cellThickness={0.5}
      cellColor="#1f2d45"
      sectionSize={5}
      sectionThickness={0.8}
      sectionColor="#2a3d5c"
      fadeDistance={50}
      fadeStrength={1.2}
      infiniteGrid
    />
  )
}

function SceneContent() {
  const { scene } = useThree()
  scene.fog = new THREE.FogExp2('#05070d', 0.012)

  return (
    <>
      <color attach="background" args={['#05070d']} />
      <EnvironmentProbe />
      <ambientLight intensity={0.28} color="#4a5a78" />
      <hemisphereLight color="#5c6f8f" groundColor="#0f121a" intensity={0.22} position={[0, 20, 0]} />
      <directionalLight color="#a5b0c5" intensity={0.55} position={[8, 14, 8]} castShadow />
      <directionalLight color="#3a4560" intensity={0.3} position={[-8, 8, -6]} />
      <pointLight color="#5b6b88" intensity={0.75} distance={50} decay={1.8} position={[0, 5, 0]} />
      <spotLight color="#8a9ab5" intensity={0.5} distance={40} angle={Math.PI / 4} penumbra={0.6} position={[0, 12, 0]} target-position={[0, 0, 0]} />
      <Suspense fallback={null}>
        <GalaxyBackground />
        <SpaceStation />
        <FarStation />
        <玻璃文字标题 />
      </Suspense>
      <ArchiveGrid />
      <ArchiveRings />
      <EntitySpotlights />
      <InstancedParticles />
      <Entities />
      <FloatingBoard />
      <CameraController />
    </>
  )
}

export function Theater() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0.8, 10], fov: 50, near: 0.1, far: 200 }}
        dpr={[1, 1.5]}
        gl={创建渲染器}
      >
        <SceneContent />
        <PostProcessingStack />
      </Canvas>
    </div>
  )
}
