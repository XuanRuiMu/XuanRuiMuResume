import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Text3D, MeshTransmissionMaterial, useFont } from '@react-three/drei'
import { useTheaterStore } from '../store/useTheaterStore'

const 字体路径 = '/fonts/helvetiker_bold.typeface.json'
useFont.preload(字体路径)

export default function HeroText3D() {
  const 网格引用 = useRef()
  const { gl } = useThree()
  const 是否WebGPU = gl.isWebGPURenderer === true

  const 基础材质属性 = useMemo(
    () => ({
      color: new THREE.Color('#aaccff'),
      roughness: 0.12,
      ior: 1.55,
      envMapIntensity: 1.6,
    }),
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const 滚动进度 = useTheaterStore.getState().scrollProgress || 0
    if (网格引用.current) {
      网格引用.current.rotation.y = Math.sin(t * 0.12) * 0.08 + 滚动进度 * 0.35
      网格引用.current.position.y = Math.sin(t * 0.25) * 0.08 + 滚动进度 * 1.2
      const 缩放 = Math.max(0.5, 1 - 滚动进度 * 0.25)
      网格引用.current.scale.setScalar(缩放)
    }
  })

  return (
    <group position={[0, 2.6, -2]}>
      <Text3D
        ref={网格引用}
        font={字体路径}
        size={0.65}
        height={0.35}
        curveSegments={4}
        bevelEnabled
        bevelThickness={0.03}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={4}
        letterSpacing={0.04}
        onUpdate={(self) => self.geometry.center()}
      >
        XUANRUIMU
        {是否WebGPU ? (
          <meshPhysicalMaterial
            color={基础材质属性.color}
            transmission={1}
            thickness={1.2}
            roughness={基础材质属性.roughness}
            ior={基础材质属性.ior}
            envMapIntensity={基础材质属性.envMapIntensity}
            transparent
          />
        ) : (
          <MeshTransmissionMaterial
            color={基础材质属性.color}
            transmission={1}
            thickness={1.2}
            roughness={基础材质属性.roughness}
            ior={基础材质属性.ior}
            chromaticAberration={0.06}
            anisotropy={0.3}
            samples={6}
            backside
            backsideThickness={1.2}
            envMapIntensity={基础材质属性.envMapIntensity}
          />
        )}
      </Text3D>
    </group>
  )
}
