import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 color;
  varying vec3 vColor;
  uniform float uPixelRatio;
  uniform float uScale;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * (uScale / -mvPosition.z);
  }
`

const STAR_FRAG = /* glsl */ `
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r2 = dot(c, c);
    if (r2 > 0.25) discard;
    float a = 1.0 - smoothstep(0.0, 0.25, r2);
    gl_FragColor = vec4(vColor, a * 0.45);
  }
`

const COSMIC_VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 color;
  varying vec3 vColor;
  uniform float uPixelRatio;
  uniform float uScale;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * (uScale * 2.0 / -mvPosition.z);
  }
`

const COSMIC_FRAG = /* glsl */ `
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r2 = dot(c, c);
    if (r2 > 0.25) discard;
    float a = 1.0 - smoothstep(0.0, 0.25, r2);
    gl_FragColor = vec4(vColor, a * 0.25);
  }
`

function makeGalaxyTexture() {
  const SIZE = 1024
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  const cx = SIZE / 2
  const cy = SIZE / 2
  const rMax = SIZE / 2 - 4

  const bulgeGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rMax * 0.18)
  bulgeGrad.addColorStop(0, 'rgba(255, 240, 200, 0.55)')
  bulgeGrad.addColorStop(0.5, 'rgba(255, 200, 130, 0.28)')
  bulgeGrad.addColorStop(1, 'rgba(255, 180, 120, 0)')
  ctx.fillStyle = bulgeGrad
  ctx.fillRect(0, 0, SIZE, SIZE)

  const diskGrad = ctx.createRadialGradient(cx, cy, rMax * 0.1, cx, cy, rMax)
  diskGrad.addColorStop(0, 'rgba(255, 220, 180, 0.22)')
  diskGrad.addColorStop(0.4, 'rgba(220, 180, 240, 0.12)')
  diskGrad.addColorStop(1, 'rgba(140, 120, 200, 0)')
  ctx.fillStyle = diskGrad
  ctx.fillRect(0, 0, SIZE, SIZE)

  for (let i = 0; i < 16000; i++) {
    const arm = i % 4
    const t = Math.random()
    const theta = arm * (Math.PI / 2) + t * 4 + Math.random() * 0.4
    const r = (rMax * 0.1 + t * rMax * 0.85) * (0.95 + Math.random() * 0.1)
    const x = cx + r * Math.cos(theta)
    const y = cy + r * Math.sin(theta)
    if (Math.hypot(x - cx, y - cy) > rMax) continue
    const tone = Math.random() < 0.7 ? 0 : 1
    ctx.fillStyle =
      tone === 0
        ? `rgba(255, ${220 + Math.random() * 35}, ${190 + Math.random() * 50}, ${0.3 + Math.random() * 0.5})`
        : `rgba(${180 + Math.random() * 60}, ${180 + Math.random() * 60}, 255, ${0.2 + Math.random() * 0.5})`
    ctx.fillRect(x, y, 0.4 + Math.random() * 1.6, 0.4 + Math.random() * 1.6)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

function makeArmPoints(count = 6000, radius = 60) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const colorWarm = new THREE.Color(0xffe0b0)
  const colorCool = new THREE.Color(0xc8c0ff)

  for (let i = 0; i < count; i++) {
    const arm = i % 4
    const t = Math.random()
    const theta = arm * (Math.PI / 2) + t * 4 + Math.random() * 0.3
    const r = radius * 0.08 + t * radius * 0.92 + Math.random() * radius * 0.03
    positions[i * 3] = r * Math.cos(theta)
    positions[i * 3 + 1] = (Math.random() - 0.5) * radius * 0.04 * (1 - t * 0.7)
    positions[i * 3 + 2] = r * Math.sin(theta)
    const c = Math.random() < 0.5 ? colorWarm : colorCool
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
    sizes[i] = 0.35 + Math.random() * 0.75
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  return geometry
}

function makeCosmicDust(count = 8000, range = 90) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const centers = []
  const N_CLUSTERS = 40

  for (let i = 0; i < N_CLUSTERS; i++) {
    centers.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * 2 * range,
        (Math.random() - 0.5) * 2 * range * 0.5,
        (Math.random() - 0.5) * 2 * range
      )
    )
  }

  for (let i = 0; i < count; i++) {
    const cluster = Math.random() < 0.85 ? centers[Math.floor(Math.random() * N_CLUSTERS)] : new THREE.Vector3(0, 0, 0)
    const r = Math.pow(Math.random(), 2) * range * 0.35
    const t = Math.random() * Math.PI * 2
    positions[i * 3] = cluster.x + r * Math.cos(t)
    positions[i * 3 + 1] = cluster.y + (Math.random() - 0.5) * r * 0.4
    positions[i * 3 + 2] = cluster.z + r * Math.sin(t)
    if (Math.random() < 0.7) {
      colors[i * 3] = 1.0
      colors[i * 3 + 1] = 0.85 + Math.random() * 0.15
      colors[i * 3 + 2] = 0.7 + Math.random() * 0.2
    } else {
      colors[i * 3] = 0.7 + Math.random() * 0.2
      colors[i * 3 + 1] = 0.85 + Math.random() * 0.15
      colors[i * 3 + 2] = 1.0
    }
    sizes[i] = 0.25 + Math.random() * 0.55
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  return geometry
}

function makeStarDomePoints(count = 5000, radius = 78) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const r = radius * (0.85 + Math.random() * 0.15)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
    const intensity = 0.7 + Math.random() * 0.3
    const tone = Math.random()
    if (tone < 0.7) {
      colors[i * 3] = intensity
      colors[i * 3 + 1] = intensity * (0.92 + Math.random() * 0.08)
      colors[i * 3 + 2] = intensity * (0.85 + Math.random() * 0.1)
    } else {
      colors[i * 3] = intensity * (0.8 + Math.random() * 0.1)
      colors[i * 3 + 1] = intensity * (0.85 + Math.random() * 0.1)
      colors[i * 3 + 2] = intensity
    }
    sizes[i] = 0.2 + Math.random() * 0.5
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  return geometry
}

function GalaxyDisk() {
  const texture = useMemo(() => makeGalaxyTexture(), [])
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [texture]
  )

  useEffect(() => {
    return () => {
      texture.dispose()
      material.dispose()
    }
  }, [texture, material])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -55, 0]} material={material}>
      <planeGeometry args={[220, 220]} />
    </mesh>
  )
}

function StarDome() {
  const geometry = useMemo(() => makeStarDomePoints(5000, 78), [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uPixelRatio: { value: window.devicePixelRatio || 1 }, uScale: { value: 55 } },
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
      }),
    []
  )

  const { viewport } = useThree()
  useEffect(() => {
    material.uniforms.uPixelRatio.value = viewport.dpr
  }, [viewport.dpr, material])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return (
    <points geometry={geometry} material={material} frustumCulled={false}>
      <primitive object={new THREE.Object3D()} />
    </points>
  )
}

function ArmStars() {
  const geometry = useMemo(() => makeArmPoints(6000, 60), [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uPixelRatio: { value: window.devicePixelRatio || 1 }, uScale: { value: 42 } },
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
      }),
    []
  )

  const { viewport } = useThree()
  useEffect(() => {
    material.uniforms.uPixelRatio.value = viewport.dpr
  }, [viewport.dpr, material])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return (
    <points geometry={geometry} material={material} frustumCulled={false}>
      <primitive object={new THREE.Object3D()} />
    </points>
  )
}

function CosmicDust() {
  const geometry = useMemo(() => makeCosmicDust(8000, 90), [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uPixelRatio: { value: window.devicePixelRatio || 1 }, uScale: { value: 75 } },
        vertexShader: COSMIC_VERT,
        fragmentShader: COSMIC_FRAG,
      }),
    []
  )

  const { viewport } = useThree()
  useEffect(() => {
    material.uniforms.uPixelRatio.value = viewport.dpr
  }, [viewport.dpr, material])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return (
    <points geometry={geometry} material={material} frustumCulled={false}>
      <primitive object={new THREE.Object3D()} />
    </points>
  )
}

function RotatingGroup({ children, speed = 0.002 }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * speed
  })
  return <group ref={ref}>{children}</group>
}

export function GalaxyBackground() {
  return (
    <group>
      <RotatingGroup speed={0.0008}>
        <StarDome />
      </RotatingGroup>
      <RotatingGroup speed={0.0003}>
        <ArmStars />
        <GalaxyDisk />
      </RotatingGroup>
      <RotatingGroup speed={0.00015}>
        <CosmicDust />
      </RotatingGroup>
    </group>
  )
}
