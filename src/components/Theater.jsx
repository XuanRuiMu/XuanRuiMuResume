import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { Grid, useGLTF } from '@react-three/drei'
import { Entities } from './Entities'
import { CameraController } from './CameraController'
import { FloatingBoard } from './FloatingBoard'
import { GalaxyBackground } from './GalaxyBackground'
import { SpaceStation, FarStation } from './SpaceStation'
import { useTheaterStore, SECTION_META } from '../store/useTheaterStore'

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
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0.08 },
    }),
    [color]
  )

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
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
      }),
    [uniforms]
  )

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

function AmbientDust() {
  const count = 600
  const points = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20 + 4
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40
    }
    return positions
  }, [])

  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.003
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.2
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={points} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#7c8fa8" size={0.035} transparent opacity={0.3} sizeAttenuation />
    </points>
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
      </Suspense>
      <ArchiveGrid />
      <ArchiveRings />
      <EntitySpotlights />
      <AmbientDust />
      <Entities />
      <FloatingBoard />
      <CameraController />
    </>
  )
}

export function Theater() {
  const activeSection = useTheaterStore((s) => s.activeSection)

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0.8, 10], fov: 50, near: 0.1, far: 200 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <SceneContent />
        <EffectComposer>
          <Bloom
            intensity={activeSection ? 0.9 : 0.55}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.5}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.05} darkness={0.65} />
          <Noise opacity={0.035} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
