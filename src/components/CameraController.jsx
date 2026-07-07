import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useTheaterStore } from '../store/useTheaterStore'

const RADIUS = 5.6
const CENTER = new THREE.Vector3(0, 0.4, 0)
const SECTION_ORDER = ['it', 'edu', 'design', 'music', 'media']

function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

export function CameraController() {
  const { camera } = useThree()
  const activeSection = useTheaterStore((s) => s.activeSection)
  const targetRef = useRef(new THREE.Vector3(0, 0.8, 10))
  const lookAtRef = useRef(new THREE.Vector3(0, 0.4, 0))
  const currentLookAt = useRef(new THREE.Vector3(0, 0.4, 0))

  const fromPos = useRef(new THREE.Vector3(0, 0.8, 10))
  const fromLookAt = useRef(new THREE.Vector3(0, 0.4, 0))
  const progress = useRef(1)
  const duration = useRef(0)
  const startTime = useRef(0)

  useEffect(() => {
    fromPos.current.copy(camera.position)
    fromLookAt.current.copy(currentLookAt.current)
    progress.current = 0
    startTime.current = performance.now()

    if (activeSection) {
      const index = SECTION_ORDER.indexOf(activeSection)
      const angle = (index * 72 - 90) * (Math.PI / 180)
      const ex = Math.cos(angle) * RADIUS
      const ez = Math.sin(angle) * RADIUS
      targetRef.current.set(ex * 0.45, 1.75, ez * 0.45 + 4.8)
      lookAtRef.current.set(ex, 1.85, ez)
      duration.current = 900
    } else {
      targetRef.current.set(0, 0.8, 10)
      lookAtRef.current.copy(CENTER)
      duration.current = 750
    }
  }, [activeSection, camera.position])

  useFrame(() => {
    if (progress.current < 1) {
      const elapsed = performance.now() - startTime.current
      progress.current = Math.min(1, elapsed / duration.current)
    }
    const e = smoothstep(progress.current)
    camera.position.lerpVectors(fromPos.current, targetRef.current, e)
    currentLookAt.current.lerpVectors(fromLookAt.current, lookAtRef.current, e)
    camera.lookAt(currentLookAt.current)
  })

  return null
}
