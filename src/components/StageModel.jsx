import { useRef, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export function StageModel() {
  const { scene } = useGLTF('/models/stage.glb')
  const modelRef = useRef()

  const cloned = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        const old = child.material
        const mat = new THREE.MeshStandardMaterial({
          color: '#2a2a38',
          roughness: 0.5,
          metalness: 0.55,
          emissive: '#151520',
          emissiveIntensity: 0.55,
        })
        if (old && old.map) {
          mat.map = old.map
          mat.color.set('#6a6a78')
        }
        child.material = mat
      }
    })
    return clone
  }, [scene])

  return (
    <group ref={modelRef} position={[0, -2.2, 0]} scale={0.15}>
      <primitive object={cloned} />
      <pointLight color="#4a5568" intensity={0.9} distance={12} decay={2} position={[0, 2, 0]} />
      <pointLight color="#3b4255" intensity={0.6} distance={10} decay={2} position={[0, 0.5, 4]} />
    </group>
  )
}
