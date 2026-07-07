import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useTheaterStore, SECTION_META } from '../store/useTheaterStore'
import { audioManager } from '../utils/audio'
import { HolographicMaterial } from './HolographicMaterial'

function OrbitField({ count, radius, speed = 1, children, showBeams = false, color, hovered }) {
  const objectsRef = useRef([])
  const beamGeometry = useMemo(() => {
    if (!showBeams) return null
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 6)
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [count, showBeams])

  const data = useMemo(() => {
    const [rMin, rMax] = Array.isArray(radius) ? radius : [radius, radius]
    return Array.from({ length: count }).map((_, i) => ({
      radius: rMin + Math.random() * (rMax - rMin),
      speed: (0.25 + Math.random() * 0.45) * speed,
      offset: (i / count) * Math.PI * 2,
      y: (Math.random() - 0.5) * 0.5,
    }))
  }, [count, radius, speed])

  useFrame((state) => {
    const positions = beamGeometry?.attributes.position?.array
    const boost = hovered ? 2.2 : 1
    data.forEach((d, i) => {
      const t = state.clock.elapsedTime * d.speed * boost + d.offset
      const x = Math.cos(t) * d.radius
      const z = Math.sin(t) * d.radius
      const obj = objectsRef.current[i]
      if (obj) obj.position.set(x, d.y, z)
      if (positions) {
        positions[i * 6] = 0
        positions[i * 6 + 1] = 0
        positions[i * 6 + 2] = 0
        positions[i * 6 + 3] = x
        positions[i * 6 + 4] = d.y
        positions[i * 6 + 5] = z
      }
    })
    if (beamGeometry) beamGeometry.attributes.position.needsUpdate = true
  })

  return (
    <group>
      {data.map((d, i) => (
        <group key={i} ref={(el) => { objectsRef.current[i] = el }}>
          {children({ index: i, data: d })}
        </group>
      ))}
      {showBeams && beamGeometry && (
        <lineSegments geometry={beamGeometry}>
          <lineBasicMaterial color={color} transparent opacity={hovered ? 0.5 : 0.18} />
        </lineSegments>
      )}
    </group>
  )
}

function GlowRing({ radius, tube = 0.012, color, opacity, hovered, rotateSpeed = 0.5, tilt = [Math.PI / 2, 0, 0] }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * rotateSpeed * (hovered ? 1.6 : 0.6)
  })
  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, tube, 8, 64]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  )
}

function ITEntity({ hovered, color, baseColor }) {
  const group = useRef()
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y += hovered ? 0.032 : 0.008
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.03
    }
  })

  return (
    <group ref={group}>
      <pointLight color={color} intensity={hovered ? 2.4 : 0.7} distance={5.5} decay={2} position={[0, 0, 0]} />
      <mesh>
        <icosahedronGeometry args={[0.38, 1]} />
        <HolographicMaterial
          color={color}
          baseColor={baseColor}
          hovered={hovered}
          baseIntensity={0.45}
          hoverBoost={1.2}
          metalness={0.85}
          roughness={0.18}
          envMapIntensity={1.4}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.58, 0.014, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.7 : 0.32} />
      </mesh>
      <OrbitField count={4} radius={[0.82, 1.05]} speed={0.55} showBeams color={color} hovered={hovered}>
        {() => (
          <group>
            <mesh>
              <boxGeometry args={[0.22, 0.14, 0.26]} />
              <meshStandardMaterial
                color="#080d14"
                emissive={color}
                emissiveIntensity={hovered ? 1.1 : 0.55}
                roughness={0.35}
                metalness={0.7}
              />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.6, 0.02, 0.18]} />
              <meshStandardMaterial
                color="#111b2a"
                emissive={color}
                emissiveIntensity={0.25}
                roughness={0.4}
                metalness={0.5}
              />
            </mesh>
            <mesh position={[0, 0.08, 0]}>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshBasicMaterial color={color} />
            </mesh>
          </group>
        )}
      </OrbitField>
      {[0.95, 1.22].map((r, i) => (
        <GlowRing
          key={i}
          radius={r}
          color={color}
          opacity={hovered ? 0.55 - i * 0.12 : 0.22 - i * 0.06}
          hovered={hovered}
          rotateSpeed={0.35 + i * 0.15}
        />
      ))}
      {hovered && (
        <lineSegments>
          <edgesGeometry args={[new THREE.IcosahedronGeometry(0.62, 1)]} />
          <lineBasicMaterial color={color} transparent opacity={0.45} />
        </lineSegments>
      )}
    </group>
  )
}

function EduEntity({ hovered, color, baseColor }) {
  const group = useRef()
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * (hovered ? 0.4 : 0.12)
      group.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.06
    }
  })

  return (
    <group ref={group}>
      <pointLight color={color} intensity={hovered ? 2.3 : 0.65} distance={5.5} decay={2} position={[0, 0, 0]} />
      <mesh>
        <octahedronGeometry args={[0.48, 0]} />
        <HolographicMaterial
          color={color}
          baseColor={baseColor}
          hovered={hovered}
          baseIntensity={0.35}
          hoverBoost={1.1}
          metalness={0.4}
          roughness={0.18}
          clearcoat={0.4}
          envMapIntensity={1.4}
        />
      </mesh>
      <mesh scale={hovered ? 0.55 : 0.42}>
        <octahedronGeometry args={[0.42, 0]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.55 : 0.28} />
      </mesh>
      <OrbitField count={6} radius={[0.78, 1.08]} speed={0.45} showBeams color={color} hovered={hovered}>
        {() => (
          <group rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.28, 0.34, 0.02]} />
              <meshStandardMaterial
                color="#e8e0d0"
                emissive={color}
                emissiveIntensity={hovered ? 0.6 : 0.25}
                roughness={0.4}
                metalness={0.2}
              />
            </mesh>
            <mesh position={[0, 0, 0.012]}>
              <planeGeometry args={[0.22, 0.28]} />
              <meshBasicMaterial color={color} transparent opacity={hovered ? 0.5 : 0.22} />
            </mesh>
          </group>
        )}
      </OrbitField>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
          <torusGeometry args={[1.05 + i * 0.1, 0.016, 8, 64]} />
          <meshBasicMaterial color={color} transparent opacity={hovered ? 0.6 : 0.3} />
        </mesh>
      ))}
      {hovered && (
        <lineSegments>
          <edgesGeometry args={[new THREE.OctahedronGeometry(0.72, 0)]} />
          <lineBasicMaterial color={color} transparent opacity={0.5} />
        </lineSegments>
      )}
    </group>
  )
}

function DesignEntity({ hovered, color, baseColor }) {
  const group = useRef()
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * (hovered ? 0.34 : 0.1)
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.04
    }
  })

  const 条材质属性 = {
    color,
    baseColor,
    hovered,
    baseIntensity: 0.4,
    hoverBoost: 0.9,
    metalness: 0.75,
    roughness: 0.25,
    envMapIntensity: 1.4,
  }

  return (
    <group ref={group}>
      <pointLight color={color} intensity={hovered ? 2.2 : 0.6} distance={5.5} decay={2} position={[0, 0, 0]} />
      <group scale={hovered ? 1.12 : 1}>
        <mesh rotation={[0, 0, Math.PI / 3]} position={[0, 0.42, 0]}>
          <boxGeometry args={[1.4, 0.16, 0.16]} />
          <HolographicMaterial {...条材质属性} />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 3]} position={[0.6, -0.28, 0]}>
          <boxGeometry args={[1.4, 0.16, 0.16]} />
          <HolographicMaterial {...条材质属性} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI]} position={[-0.6, -0.28, 0]}>
          <boxGeometry args={[1.4, 0.16, 0.16]} />
          <HolographicMaterial {...条材质属性} />
        </mesh>
      </group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusKnotGeometry args={[0.62, 0.04, 128, 8, 2, 3]} />
        <HolographicMaterial
          color={color}
          baseColor={baseColor}
          hovered={hovered}
          baseIntensity={0.35}
          hoverBoost={1.0}
          metalness={0.8}
          roughness={0.2}
          envMapIntensity={1.4}
        />
      </mesh>
      <OrbitField count={5} radius={[0.85, 1.15]} speed={0.5} color={color} hovered={hovered}>
        {({ index }) => (
          <mesh rotation={[0, 0, index % 2 === 0 ? Math.PI / 4 : -Math.PI / 4]}>
            <planeGeometry args={[0.24, 0.32]} />
            <meshBasicMaterial color={color} transparent opacity={hovered ? 0.45 : 0.22} side={THREE.DoubleSide} />
          </mesh>
        )}
      </OrbitField>
      {hovered && (
        <>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(1.55, 1.55, 0.16)]} />
            <lineBasicMaterial color={color} transparent opacity={0.45} />
          </lineSegments>
          <mesh scale={0.25}>
            <tetrahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={color} transparent opacity={0.35} />
          </mesh>
        </>
      )}
    </group>
  )
}

function MusicEntity({ hovered, color, baseColor }) {
  const group = useRef()
  const pads = useMemo(() => {
    const notes = ['#00D9FF', '#FF9F43', '#A55EEA', '#A855F7', '#FF6B9D', '#4ECDC4', '#00D9FF', '#FF006E']
    return Array.from({ length: 8 }).map((_, i) => ({
      angle: (i / 8) * Math.PI * 2,
      radius: 0.55,
      note: notes[i % notes.length],
    }))
  }, [])

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * (hovered ? 0.55 : 0.14)
    }
  })

  return (
    <group ref={group}>
      <pointLight color={color} intensity={hovered ? 2.4 : 0.7} distance={5.5} decay={2} position={[0, 0, 0]} />
      <mesh>
        <cylinderGeometry args={[0.75, 0.8, 0.22, 40]} />
        <HolographicMaterial
          color={color}
          baseColor={baseColor}
          hovered={hovered}
          baseIntensity={0.35}
          hoverBoost={1.1}
          metalness={0.8}
          roughness={0.25}
          clearcoat={0.5}
          envMapIntensity={1.4}
        />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.03, 40]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.55 : 0.28} />
      </mesh>
      {pads.map((p, i) => {
        const x = Math.cos(p.angle) * p.radius
        const z = Math.sin(p.angle) * p.radius
        return (
          <mesh key={i} position={[x, 0.28, z]} scale={hovered ? 0.14 : 0.11}>
            <boxGeometry args={[1, 0.35, 1]} />
            <meshStandardMaterial
              color={p.note}
              emissive={p.note}
              emissiveIntensity={hovered ? 2.2 : 1.0}
              roughness={0.2}
              metalness={0.5}
            />
          </mesh>
        )
      })}
      {[0.4, 0.6, 0.85].map((r, i) => (
        <GlowRing
          key={i}
          radius={r}
          tube={0.015}
          color={color}
          opacity={hovered ? 0.65 - i * 0.15 : 0.3 - i * 0.08}
          hovered={hovered}
          rotateSpeed={0.6 + i * 0.2}
        />
      ))}
      <OrbitField count={4} radius={[0.95, 1.2]} speed={0.6} color={color} hovered={hovered}>
        {({ index }) => (
          <mesh rotation={[0, index * Math.PI / 2, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        )}
      </OrbitField>
      {hovered && (
        <mesh position={[0, 1.05, 0]} scale={0.4}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}

function MediaEntity({ hovered, color, baseColor }) {
  const group = useRef()
  const fragments = useMemo(
    () => [
      { type: 'film', color: '#FF6B9D' },
      { type: 'book', color: '#4ECDC4' },
      { type: 'game', color: '#A855F7' },
      { type: 'video', color: '#FF9F43' },
    ],
    []
  )

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * (hovered ? 0.34 : 0.1)
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.22) * 0.04
    }
  })

  return (
    <group ref={group}>
      <pointLight color={color} intensity={hovered ? 2.3 : 0.65} distance={5.5} decay={2} position={[0, 0, 0]} />
      <mesh>
        <dodecahedronGeometry args={[0.48, 0]} />
        <HolographicMaterial
          color={color}
          baseColor={baseColor}
          hovered={hovered}
          baseIntensity={0.4}
          hoverBoost={1.1}
          metalness={0.55}
          roughness={0.35}
          clearcoat={0.4}
          envMapIntensity={1.4}
        />
      </mesh>
      <OrbitField count={4} radius={[0.88, 1.12]} speed={0.4} showBeams color={color} hovered={hovered}>
        {({ index }) => {
          const f = fragments[index % fragments.length]
          return (
            <group>
              {f.type === 'film' && (
                <mesh>
                  <boxGeometry args={[0.42, 0.28, 0.02]} />
                  <meshBasicMaterial color={f.color} transparent opacity={hovered ? 0.85 : 0.45} />
                </mesh>
              )}
              {f.type === 'book' && (
                <mesh>
                  <boxGeometry args={[0.32, 0.42, 0.06]} />
                  <meshStandardMaterial color="#f5e6d3" emissive={f.color} emissiveIntensity={0.35} roughness={0.6} />
                </mesh>
              )}
              {f.type === 'game' && (
                <group>
                  <mesh>
                    <boxGeometry args={[0.34, 0.34, 0.08]} />
                    <meshStandardMaterial color="#0f0f0f" emissive={f.color} emissiveIntensity={0.5} />
                  </mesh>
                  <mesh position={[0, 0, 0.05]}>
                    <boxGeometry args={[0.24, 0.06, 0.02]} />
                    <meshBasicMaterial color={f.color} />
                  </mesh>
                  <mesh position={[0, 0, 0.05]} rotation={[0, 0, Math.PI / 2]}>
                    <boxGeometry args={[0.24, 0.06, 0.02]} />
                    <meshBasicMaterial color={f.color} />
                  </mesh>
                </group>
              )}
              {f.type === 'video' && (
                <mesh>
                  <boxGeometry args={[0.4, 0.24, 0.02]} />
                  <meshStandardMaterial
                    color="#1a1a1a"
                    emissive={f.color}
                    emissiveIntensity={hovered ? 0.8 : 0.35}
                    roughness={0.3}
                  />
                </mesh>
              )}
            </group>
          )
        }}
      </OrbitField>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
          <torusGeometry args={[1.15 + i * 0.08, 0.018, 8, 48]} />
          <meshBasicMaterial color={color} transparent opacity={hovered ? 0.6 : 0.3} />
        </mesh>
      ))}
      {hovered && (
        <lineSegments>
          <edgesGeometry args={[new THREE.DodecahedronGeometry(0.78, 0)]} />
          <lineBasicMaterial color={color} transparent opacity={0.45} />
        </lineSegments>
      )}
    </group>
  )
}

const ENTITY_COMPONENTS = {
  it: ITEntity,
  edu: EduEntity,
  design: DesignEntity,
  music: MusicEntity,
  media: MediaEntity,
}

export function EntityObject({ section, position, angle }) {
  const groupRef = useRef()
  const meta = SECTION_META[section]
  const activeSection = useTheaterStore((s) => s.activeSection)
  const hoveredSection = useTheaterStore((s) => s.hoveredSection)
  const scrollSection = useTheaterStore((s) => s.scrollSection)
  const setHoveredSection = useTheaterStore((s) => s.setHoveredSection)
  const setActiveSection = useTheaterStore((s) => s.setActiveSection)
  const audioEnabled = useTheaterStore((s) => s.audioEnabled)
  const isActive = activeSection === section
  const isHovered = hoveredSection === section && activeSection === null
  const isScrollFocused = scrollSection === section && activeSection === null
  const isFocused = isHovered || isScrollFocused

  useFrame((state) => {
    if (!groupRef.current) return
    if (!isActive) {
      groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 1.4 + angle) * 0.08
    }
  })

  const handlePointerOver = (e) => {
    e.stopPropagation()
    if (activeSection) return
    setHoveredSection(section)
    if (audioEnabled) audioManager.playHover()
  }

  const handlePointerOut = (e) => {
    e.stopPropagation()
    setHoveredSection(null)
  }

  const handleClick = (e) => {
    e.stopPropagation()
    if (activeSection) return
    audioManager.ensureRunning()
    audioManager.playClick()
    setActiveSection(section)
  }

  const EntityComponent = ENTITY_COMPONENTS[section]

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, -angle + Math.PI / 2, 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      scale={isActive ? 0.001 : isFocused ? 1.15 : 1}
    >
      <mesh position={[0, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.52, 32]} />
        <meshBasicMaterial color={meta.color} transparent opacity={isFocused ? 0.75 : 0.28} />
      </mesh>
      <EntityComponent hovered={isFocused} color={meta.color} baseColor={meta.darkColor} />
      <Html center distanceFactor={8} style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div
          className="text-center transition-all duration-300"
          style={{
            opacity: activeSection ? 0 : isFocused ? 1 : 0,
            transform: `translateY(${isFocused ? -110 : -90}px)`,
            transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div
            className="px-4 py-1.5 rounded-full glass-panel text-lg font-medium tracking-widest text-glow"
            style={{ color: meta.color, borderColor: `${meta.color}40` }}
          >
            {meta.title}
          </div>
          <div className="text-xs text-white/60 mt-2">{meta.description}</div>
        </div>
      </Html>
    </group>
  )
}
