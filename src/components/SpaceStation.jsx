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
          color: '#1a1d26',
          roughness: 0.8,
          metalness: 0.35,
          emissive: '#05070a',
          emissiveIntensity: 0.08,
        })
        if (old && old.map) {
          mat.map = old.map
          mat.color.set('#252a36')
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
    <group ref={groupRef} position={[0, -9, 22]} scale={0.08}>
      <primitive object={cloned} />
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
          color: '#252836',
          roughness: 0.75,
          metalness: 0.45,
          emissive: '#0a0c12',
          emissiveIntensity: 0.12,
        })
        if (old && old.map) {
          mat.map = old.map
          mat.color.set('#3a3e4e')
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
    <group ref={groupRef} position={[0, -30, -90]} scale={10}>
      <primitive object={cloned} />
      <sprite position={[0, 8, 0]}>
        <primitive object={makeGlowSprite(0x7c8fa8, 24)} />
      </sprite>
    </group>
  )
}
