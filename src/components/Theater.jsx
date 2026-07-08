import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { NodeMaterial } from 'three/webgpu'
import { vec3, float, uniform, smoothstep, uv, positionWorld, mx_noise_float, abs, max, div, oneMinus, pow } from 'three/tsl'
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
import { useTheaterStore, SECTION_META } from '../store/useTheaterStore'

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
          <meshBasicMaterial color="#2a3a58" transparent opacity={0.22 - i * 0.05} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

function VolumetricCone({ position, color, section }) {
  const { gl } = useThree()
  const 是否WebGPU = gl.isWebGPURenderer === true
  const activeSection = useTheaterStore((s) => s.activeSection)
  const hoveredSection = useTheaterStore((s) => s.hoveredSection)
  const isActive = activeSection === section
  const isHovered = hoveredSection === section

  const { material, uniforms } = useMemo(() => {
    const uniforms = {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0.22 },
      uIntensity: { value: 1.6 },
      uTime: { value: 0 },
      uNoiseScale: { value: 1.2 },
      uNoiseSpeed: { value: 0.35 },
    }

    if (是否WebGPU) {
      const 颜色Uniform = uniform(uniforms.uColor.value)
      const 透明度Uniform = uniform(uniforms.uOpacity.value)
      const 强度Uniform = uniform(uniforms.uIntensity.value)
      const 时间Uniform = uniform(uniforms.uTime.value)
      const 噪声缩放Uniform = uniform(uniforms.uNoiseScale.value)
      const 噪声速度Uniform = uniform(uniforms.uNoiseSpeed.value)

      const vUv = uv()
      const 高度 = vUv.y
      const 径向偏移 = abs(vUv.x.sub(0.5)).mul(2.0)
      const 边缘距离 = div(径向偏移, max(高度, 0.05))
      const 高度衰减 = smoothstep(0.0, 0.12, 高度).mul(pow(oneMinus(高度), 0.4))
      const 边缘衰减 = oneMinus(smoothstep(0.0, 0.75, 边缘距离))
      const 基础透明度 = 高度衰减.mul(边缘衰减)

      const 噪声位置 = positionWorld.mul(噪声缩放Uniform).add(vec3(0.0, 时间Uniform.mul(噪声速度Uniform), 0.0))
      const 噪声值 = mx_noise_float(噪声位置)
      const 尘粒 = float(0.7).add(float(0.3).mul(噪声值))
      const alpha = 基础透明度.mul(尘粒).mul(透明度Uniform).mul(强度Uniform)
      const finalColor = vec3(颜色Uniform).mul(float(1.0).add(float(0.2).mul(噪声值)))

      uniforms.uColor = 颜色Uniform
      uniforms.uOpacity = 透明度Uniform
      uniforms.uIntensity = 强度Uniform
      uniforms.uTime = 时间Uniform
      uniforms.uNoiseScale = 噪声缩放Uniform
      uniforms.uNoiseSpeed = 噪声速度Uniform

      const mat = new NodeMaterial()
      mat.colorNode = finalColor
      mat.opacityNode = alpha
      mat.transparent = true
      mat.depthWrite = false
      mat.side = THREE.DoubleSide
      mat.blending = THREE.AdditiveBlending
      return { material: mat, uniforms }
    }

    const mat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uIntensity;
        uniform float uTime;
        uniform float uNoiseScale;
        uniform float uNoiseSpeed;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0) * 2.0 + 1.0;
          vec4 s1 = floor(b1) * 2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
        }

        void main() {
          float h = vUv.y;
          float r = abs(vUv.x - 0.5) * 2.0;
          float edgeDist = r / max(h, 0.05);
          float heightFalloff = smoothstep(0.0, 0.12, h) * pow(1.0 - h, 0.4);
          float edgeFalloff = 1.0 - smoothstep(0.0, 0.75, edgeDist);
          float baseAlpha = heightFalloff * edgeFalloff;
          float n = snoise(vWorldPos * uNoiseScale + vec3(0.0, uTime * uNoiseSpeed, 0.0));
          float dust = 0.7 + 0.3 * n;
          float alpha = baseAlpha * dust * uOpacity * uIntensity;
          vec3 finalColor = uColor * (1.0 + 0.2 * n);
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
    })

    return { material: mat, uniforms }
  }, [color, 是否WebGPU])

  useFrame((state, delta) => {
    const 目标强度 = isActive ? 3.6 : isHovered ? 2.8 : 1.6
    const 目标透明度 = isActive ? 0.38 : isHovered ? 0.3 : 0.22
    uniforms.uIntensity.value = THREE.MathUtils.lerp(uniforms.uIntensity.value, 目标强度, Math.min(delta * 5, 1))
    uniforms.uOpacity.value = THREE.MathUtils.lerp(uniforms.uOpacity.value, 目标透明度, Math.min(delta * 5, 1))
    uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh position={position} material={material}>
      <cylinderGeometry args={[2.2, 0.02, 7.5, 16, 1, true]} />
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
        return <VolumetricCone key={section} section={section} position={[x, 4.25, z]} color={SECTION_META[section].color} />
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
      cellThickness={0.35}
      cellColor="#1f2d45"
      sectionSize={5}
      sectionThickness={0.65}
      sectionColor="#2a3d5c"
      fadeDistance={38}
      fadeStrength={2.0}
      infiniteGrid
    />
  )
}

function SceneContent() {
  const { scene } = useThree()
  scene.fog = new THREE.FogExp2('#020205', 0.016)

  return (
    <>
      <color attach="background" args={['#020205']} />
      <EnvironmentProbe />
      <ambientLight intensity={0.07} color="#2a3248" />
      <hemisphereLight color="#2a3450" groundColor="#080a12" intensity={0.07} position={[0, 20, 0]} />
      <directionalLight color="#5a6a8a" intensity={0.26} position={[8, 14, 8]} castShadow />
      <directionalLight color="#1a2030" intensity={0.16} position={[-8, 8, -6]} />
      <pointLight color="#3a4a68" intensity={0.35} distance={50} decay={1.8} position={[0, 5, 0]} />
      <spotLight color="#4a5a7a" intensity={0.25} distance={40} angle={Math.PI / 4} penumbra={0.6} position={[0, 12, 0]} target-position={[0, 0, 0]} />
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
