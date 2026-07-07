import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function makeGlowSprite(color, size) {
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
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`)
  grad.addColorStop(0.2, `rgba(${r},${g},${b},0.55)`)
  grad.addColorStop(0.5, `rgba(${r},${g},${b},0.12)`)
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

export function SpaceStation() {
  const { scene } = useGLTF('/models/5TxCebwK2h.glb')
  const groupRef = useRef()

  const cloned = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        const old = child.material
        const mat = new THREE.MeshStandardMaterial({
          color: '#4a4e5e',
          roughness: 0.55,
          metalness: 0.75,
          emissive: '#1a1e2e',
          emissiveIntensity: 0.35,
        })
        if (old && old.map) {
          mat.map = old.map
          mat.color.set('#6a7080')
        }
        child.material = mat
      }
    })
    return clone
  }, [scene])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <group ref={groupRef} position={[0, -3.2, 0]} scale={2.5}>
      <primitive object={cloned} />
      <pointLight color="#5a6a8a" intensity={0.45} distance={18} decay={1.8} position={[0, 2, 0]} />
      <pointLight color="#4a5568" intensity={0.28} distance={14} decay={2} position={[0, 0.5, 4]} />
      <pointLight color="#6b5b8a" intensity={0.22} distance={12} decay={2} position={[-3, 1, -2]} />
    </group>
  )
}

export function FarStation() {
  const { scene } = useGLTF('/models/emG0dq38D8f.glb')
  const groupRef = useRef()

  const cloned = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child.isMesh) {
        const old = child.material
        const mat = new THREE.MeshStandardMaterial({
          color: '#3a3e4e',
          roughness: 0.6,
          metalness: 0.7,
          emissive: '#151820',
          emissiveIntensity: 0.25,
        })
        if (old && old.map) {
          mat.map = old.map
          mat.color.set('#5a6070')
        }
        child.material = mat
      }
    })
    return clone
  }, [scene])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.005
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.02
    }
  })

  return (
    <group ref={groupRef} position={[0, -35, -80]} scale={18}>
      <primitive object={cloned} />
      <sprite position={[0, 8, 0]}>
        <primitive object={makeGlowSprite(0x7c8fa8, 24)} />
      </sprite>
    </group>
  )
}
