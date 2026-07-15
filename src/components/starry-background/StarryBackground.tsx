import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, ShaderMaterial, Vector2 } from 'three'
import type { Group, Points } from 'three'
import { cn } from '../../lib/utils'
import { usePerformanceProfile } from '../../hooks/usePerformanceProfile'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { SkillGalaxyFallback } from '../skill-galaxy/SkillGalaxyFallback'
import type { QualitySettings } from '../../domain/types'
import { createStarLayer, type StarLayerData } from './starLayer'

interface StarryBackgroundSceneProps {
  qualitySettings: QualitySettings
}

function useIsLightTheme(): boolean {
  const [isLight, setIsLight] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('light')
  )

  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    setIsLight(root.classList.contains('light'))

    const observer = new MutationObserver(() => {
      setIsLight(root.classList.contains('light'))
    })
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  return isLight
}

function useScrollProgress(): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      setProgress(window.scrollY / maxScroll)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return progress
}

const nebulaVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const nebulaFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uIntensity;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    float r = length(center);
    float t = uTime * 0.4;

    // Radial gradient: brightest at center, fades to black at edges
    float radial = 1.0 - smoothstep(0.0, 0.7, r);

    // Animated wave rings expanding from the center
    float wave = sin(r * 22.0 - t * 2.5);
    wave = wave * 0.5 + 0.5;
    float waveFalloff = exp(-r * 3.0);
    float pattern = radial * (0.5 + 0.5 * wave) * waveFalloff;

    // Subtle fractal texture for organic variation
    float n = fbm(uv * 3.5 + vec2(t * 0.08));
    pattern *= (0.8 + 0.2 * n);

    // Color: center is blue, mid tones pick up accent, edges are dark
    vec3 color = mix(uColor1, uColor2, radial);
    color = mix(color, uColor3, wave * (1.0 - radial) * 0.45);

    float alpha = clamp(pattern * uIntensity, 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`

const starVertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aSpeed;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uRepelStrength;
  uniform float uRepelRadius;

  void main() {
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    float twinkle = 0.6 + 0.4 * sin(uTime * aSpeed + aPhase);
    vAlpha = twinkle;

    gl_PointSize = max(1.6, aSize * uPixelRatio * (560.0 / -mvPosition.z));

    // Mouse repulsion: push projected star away from cursor in clip space
    vec4 projected = projectionMatrix * mvPosition;
    vec2 starNdc = projected.xy / max(projected.w, 0.0001);
    vec2 dir = starNdc - uMouse;
    float dist = length(dir);
    if (projected.w > 0.0 && dist > 0.001 && dist < uRepelRadius) {
      float falloff = smoothstep(uRepelRadius, 0.0, dist);
      projected.xy += normalize(dir) * uRepelStrength * falloff * projected.w;
    }

    gl_Position = projected;
  }
`

const starFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float glow = 1.0 - dist * 2.0;
    glow = pow(glow, 1.1);

    gl_FragColor = vec4(vColor * 1.35, vAlpha * glow);
  }
`

function createStarShaderMaterial(pixelRatio: number): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uMouse: { value: new Vector2(0, 0) },
      uRepelStrength: { value: 0 },
      uRepelRadius: { value: 0.35 },
    },
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
}

interface StarLayerProps {
  data: StarLayerData
  pixelRatio: number
  rotationSpeed: number
  mouseRef?: { current: { x: number; y: number } }
  repelStrength?: number
  repelRadius?: number
}

function StarLayer({
  data,
  pixelRatio,
  rotationSpeed,
  mouseRef = { current: { x: 0, y: 0 } },
  repelStrength = 0,
  repelRadius = 0.35,
}: StarLayerProps) {
  const pointsRef = useRef<Points>(null)
  const material = useMemo(() => createStarShaderMaterial(pixelRatio), [pixelRatio])

  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(data.positions, 3))
    geo.setAttribute('aColor', new BufferAttribute(data.colors, 3))
    geo.setAttribute('aSize', new BufferAttribute(data.sizes, 1))
    geo.setAttribute('aPhase', new BufferAttribute(data.phases, 1))
    geo.setAttribute('aSpeed', new BufferAttribute(data.speeds, 1))
    return geo
  }, [data])

  useFrame((_, delta) => {
    const points = pointsRef.current
    if (!points) return

    material.uniforms.uTime.value += delta
    material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y)
    material.uniforms.uRepelStrength.value = repelStrength
    material.uniforms.uRepelRadius.value = repelRadius
    points.rotation.y += rotationSpeed * delta
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}

function NebulaBackground({ isLight }: { isLight: boolean }) {
  const material = useMemo(() => {
    const colors = isLight
      ? {
          color1: new Color('#ffffff'),
          color2: new Color('#7ec8ff'),
          color3: new Color('#c4b5fd'),
          intensity: 0.5,
        }
      : {
          color1: new Color('#070a12'),
          color2: new Color('#245bb5'),
          color3: new Color('#7c3aed'),
          intensity: 0.9,
        }

    return new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: colors.color1 },
        uColor2: { value: colors.color2 },
        uColor3: { value: colors.color3 },
        uIntensity: { value: colors.intensity },
      },
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
    })
  }, [isLight])

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta
  })

  return (
    <mesh position={[0, 0, -15]} scale={[40, 25, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

interface Meteor {
  positions: Float32Array
  velocity: [number, number, number]
  life: number
  maxLife: number
  active: boolean
}

function createMeteor(): Meteor {
  const y = 3 + Math.random() * 6
  const x = -12 - Math.random() * 8
  const z = -2 - Math.random() * 4
  const speed = 8 + Math.random() * 8
  const angle = -Math.PI / 6 + (Math.random() - 0.5) * 0.3

  return {
    positions: new Float32Array([x, y, z, x - 0.3, y + 0.15, z]),
    velocity: [speed * Math.cos(angle), -speed * Math.sin(angle), 0],
    life: 0,
    maxLife: 1.2 + Math.random() * 0.8,
    active: false,
  }
}

function MeteorLayer({ count }: { count: number }) {
  const meteorsRef = useRef<Meteor[]>([])
  const { geometry, material } = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array(count * 6), 3))
    geo.setAttribute('aAlpha', new BufferAttribute(new Float32Array(count * 2), 1))
    geo.setDrawRange(0, 0)

    const mat = new ShaderMaterial({
      uniforms: {
        uColor: { value: new Color('#e6f7ff') },
      },
      vertexShader: `
        attribute float aAlpha;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(uColor, vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })

    return { geometry: geo, material: mat }
  }, [count])

  useEffect(() => {
    meteorsRef.current = Array.from({ length: count }, createMeteor)
  }, [count])

  useFrame((_, delta) => {
    if (meteorsRef.current.length === 0) return

    let activeCount = 0
    const positionAttr = geometry.getAttribute('position') as BufferAttribute
    const alphaAttr = geometry.getAttribute('aAlpha') as BufferAttribute
    const positionArray = positionAttr.array as Float32Array
    const alphaArray = alphaAttr.array as Float32Array

    meteorsRef.current.forEach((meteor) => {
      if (!meteor.active) {
        if (Math.random() < delta * 0.35) {
          meteor.active = true
          meteor.life = 0
          const fresh = createMeteor()
          meteor.positions = fresh.positions
          meteor.velocity = fresh.velocity
        }
        return
      }

      meteor.life += delta
      const progress = meteor.life / meteor.maxLife

      if (progress >= 1) {
        meteor.active = false
        return
      }

      const x = meteor.positions[0] + meteor.velocity[0] * delta
      const y = meteor.positions[1] + meteor.velocity[1] * delta
      const z = meteor.positions[2] + meteor.velocity[2] * delta

      meteor.positions[0] = x
      meteor.positions[1] = y
      meteor.positions[2] = z
      meteor.positions[3] = x - meteor.velocity[0] * 0.04
      meteor.positions[4] = y - meteor.velocity[1] * 0.04
      meteor.positions[5] = z - meteor.velocity[2] * 0.04

      const alpha = Math.sin(progress * Math.PI) * 1.0
      const index = activeCount * 6
      positionArray[index] = meteor.positions[0]
      positionArray[index + 1] = meteor.positions[1]
      positionArray[index + 2] = meteor.positions[2]
      positionArray[index + 3] = meteor.positions[3]
      positionArray[index + 4] = meteor.positions[4]
      positionArray[index + 5] = meteor.positions[5]
      alphaArray[activeCount * 2] = alpha
      alphaArray[activeCount * 2 + 1] = alpha * 0.4

      activeCount += 1
    })

    positionAttr.needsUpdate = true
    alphaAttr.needsUpdate = true
    geometry.setDrawRange(0, activeCount * 2)
  })

  return <lineSegments geometry={geometry} material={material} />
}

function StarryBackgroundScene({ qualitySettings }: StarryBackgroundSceneProps) {
  const isLight = useIsLightTheme()
  const reducedMotion = useReducedMotion()
  const scrollProgress = useScrollProgress()
  const cameraRef = useRef({ x: 0, y: 0 })
  const groupRef = useRef<Group>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion) return

    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [reducedMotion])

  const totalCount = qualitySettings.particleCount
  const meteorCount = qualitySettings.postProcessing ? 5 : 0

  const { farLayer, midLayer, nearLayer } = useMemo(() => {
    const far = Math.round(totalCount * 0.55)
    const mid = Math.round(totalCount * 0.3)
    const near = Math.max(0, totalCount - far - mid)
    return {
      farLayer: createStarLayer(far, [8, 20], [0.028, 0.055], ['#ffffff', '#c2e9ff', '#f0e6ff'], 1),
      midLayer: createStarLayer(mid, [5, 14], [0.038, 0.07], ['#4aefff', '#c084fc', '#ff85b3', '#ffffff'], 2),
      nearLayer: createStarLayer(near, [3, 10], [0.055, 0.095], ['#7df3ff', '#ffffff', '#d8b4fe'], 3),
    }
  }, [totalCount])

  const dprValue = useMemo(() => {
    if (Array.isArray(qualitySettings.dpr)) return qualitySettings.dpr[0]
    return qualitySettings.dpr
  }, [qualitySettings.dpr])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || reducedMotion) return

    const targetCameraX = mouseRef.current.x * 0.6 - scrollProgress * 0.5
    const targetCameraY = mouseRef.current.y * 0.4 + scrollProgress * 0.3

    cameraRef.current.x += (targetCameraX - cameraRef.current.x) * 0.04
    cameraRef.current.y += (targetCameraY - cameraRef.current.y) * 0.04

    group.rotation.z += delta * 0.008
    group.rotation.x = cameraRef.current.y * 0.08
    group.rotation.y = cameraRef.current.x * 0.08
  })

  const environmentColor = isLight ? new Color('#f8f9fb') : new Color('#0b0c15')

  const repel = reducedMotion
    ? { far: 0, mid: 0, near: 0, radius: 0.35 }
    : { far: 0.02, mid: 0.05, near: 0.12, radius: 0.35 }

  return (
    <group ref={groupRef}>
      <color attach="background" args={[environmentColor]} />

      <NebulaBackground isLight={isLight} />
      <StarLayer
        data={farLayer}
        pixelRatio={dprValue}
        rotationSpeed={0.002}
        mouseRef={mouseRef}
        repelStrength={repel.far}
        repelRadius={repel.radius}
      />
      <StarLayer
        data={midLayer}
        pixelRatio={dprValue}
        rotationSpeed={0.004}
        mouseRef={mouseRef}
        repelStrength={repel.mid}
        repelRadius={repel.radius}
      />
      <StarLayer
        data={nearLayer}
        pixelRatio={dprValue}
        rotationSpeed={0.007}
        mouseRef={mouseRef}
        repelStrength={repel.near}
        repelRadius={repel.radius}
      />
      {meteorCount > 0 && <MeteorLayer count={meteorCount} />}
    </group>
  )
}

interface StarryBackgroundProps {
  className?: string
}

export function StarryBackground({ className }: StarryBackgroundProps) {
  const { settings, loading } = usePerformanceProfile()
  const reducedMotion = useReducedMotion()

  const containerClassName = cn('fixed inset-0 pointer-events-none', className)

  if (loading) {
    return (
      <div className={containerClassName} style={{ willChange: 'transform' }}>
        <SkillGalaxyFallback />
      </div>
    )
  }

  return (
    <div className={containerClassName} style={{ willChange: 'transform' }}>
      <Canvas
        className="!absolute inset-0"
        dpr={settings.dpr}
        fallback={<SkillGalaxyFallback />}
        frameloop={reducedMotion ? 'never' : 'always'}
        camera={{ position: [0, 0, 8], fov: 60, near: 0.1, far: 40 }}
      >
        <StarryBackgroundScene qualitySettings={settings} />
      </Canvas>
    </div>
  )
}
