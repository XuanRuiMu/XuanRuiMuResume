import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useTheaterStore } from '../store/useTheaterStore'

const 节顺序 = ['it', 'edu', 'design', 'music', 'media']
const 半径 = 5.6
const 默认位置 = new THREE.Vector3(0, 0.8, 10)
const 默认注视 = new THREE.Vector3(0, 0.4, 0)

const 刚度 = 0.008
const 阻尼 = 0.075
const 视差位移强度 = 0.25
const 视差俯仰强度 = 0.035

export function CameraController() {
  const { camera } = useThree()
  const activeSection = useTheaterStore((s) => s.activeSection)

  const 目标位置 = useRef(new THREE.Vector3().copy(默认位置))
  const 目标注视 = useRef(new THREE.Vector3().copy(默认注视))
  const 当前位置 = useRef(new THREE.Vector3().copy(默认位置))
  const 当前注视 = useRef(new THREE.Vector3().copy(默认注视))
  const 位置速度 = useRef(new THREE.Vector3())
  const 注视速度 = useRef(new THREE.Vector3())
  const 位置力 = useRef(new THREE.Vector3())
  const 注视力 = useRef(new THREE.Vector3())
  const 视差位置 = useRef(new THREE.Vector3())

  const 鼠标 = useRef({ x: 0, y: 0 })
  const 可用鼠标 = useRef(false)
  const 已初始化 = useRef(false)

  useEffect(() => {
    if (已初始化.current) return
    已初始化.current = true
    当前位置.current.copy(camera.position)
    当前注视.current.copy(默认注视)
  }, [camera.position])

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    可用鼠标.current = mq.matches
    const handleChange = (e) => {
      可用鼠标.current = e.matches
      if (!e.matches) {
        鼠标.current.x = 0
        鼠标.current.y = 0
      }
    }
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const handleMove = (e) => {
      if (!可用鼠标.current) return
      鼠标.current.x = (e.clientX / window.innerWidth) * 2 - 1
      鼠标.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    const handleLeave = () => {
      鼠标.current.x = 0
      鼠标.current.y = 0
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerleave', handleLeave)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerleave', handleLeave)
    }
  }, [])

  useEffect(() => {
    if (activeSection) {
      const index = 节顺序.indexOf(activeSection)
      const angle = (index * 72 - 90) * (Math.PI / 180)
      const ex = Math.cos(angle) * 半径
      const ez = Math.sin(angle) * 半径
      目标位置.current.set(ex * 0.45, 1.75, ez * 0.45 + 4.8)
      目标注视.current.set(ex, 1.85, ez)
    } else {
      目标位置.current.copy(默认位置)
      目标注视.current.copy(默认注视)
    }
  }, [activeSection])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const scale = dt * 60

    if (!activeSection) {
      const 滚动进度 = useTheaterStore.getState().scrollProgress || 0
      const 角度 = 滚动进度 * Math.PI * 1.2 - Math.PI * 0.6
      const 时间漂移 = state.clock.elapsedTime * 0.0003

      目标位置.current.set(
        Math.sin(角度 + 时间漂移) * 2.0,
        0.9 + 滚动进度 * 0.4 + Math.sin(时间漂移 * 1.3) * 0.04,
        9.5 + Math.cos(角度 + 时间漂移) * 0.4
      )
      目标注视.current.set(
        Math.sin(角度 + 时间漂移 * 0.7) * 3.5,
        0.7 + Math.sin(滚动进度 * Math.PI) * 0.25,
        Math.cos(角度 + 时间漂移 * 0.7) * 2.0 - 1.5
      )
    }

    位置力.current.subVectors(目标位置.current, 当前位置.current).multiplyScalar(刚度)
    位置力.current.addScaledVector(位置速度.current, -阻尼)
    位置速度.current.addScaledVector(位置力.current, scale)
    当前位置.current.addScaledVector(位置速度.current, dt)

    注视力.current.subVectors(目标注视.current, 当前注视.current).multiplyScalar(刚度)
    注视力.current.addScaledVector(注视速度.current, -阻尼)
    注视速度.current.addScaledVector(注视力.current, scale)
    当前注视.current.addScaledVector(注视速度.current, dt)

    视差位置.current.set(
      鼠标.current.x * 视差位移强度,
      鼠标.current.y * 视差位移强度 * 0.6,
      0
    )

    camera.position.copy(当前位置.current).add(视差位置.current)
    camera.lookAt(当前注视.current)
    camera.rotateX(-鼠标.current.y * 视差俯仰强度)
    camera.rotateY(鼠标.current.x * 视差俯仰强度)
  })

  return null
}
