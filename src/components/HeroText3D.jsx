import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Text3D, MeshTransmissionMaterial, useFont } from '@react-three/drei'
import { useTheaterStore } from '../store/useTheaterStore'

const 字体路径 = '/fonts/helvetiker_bold.typeface.json'
useFont.preload(字体路径)

function 创建环境贴图() {
  const 宽度 = 512
  const 高度 = 256
  const 数据 = new Uint8Array(宽度 * 高度 * 4)
  const 底部色 = new THREE.Color('#0a1322')
  const 顶部色 = new THREE.Color('#3d5a78')
  const 高光色 = new THREE.Color('#a3bcd6')

  for (let y = 0; y < 高度; y++) {
    const t = y / (高度 - 1)
    const 基础色 = new THREE.Color().lerpColors(底部色, 顶部色, Math.pow(1 - t, 1.6))
    const 水平高光 = Math.max(0, 1 - Math.abs(t - 0.55) * 4)
    const 最终色 = 基础色.clone().lerp(高光色, 水平高光 * 0.25)

    for (let x = 0; x < 宽度; x++) {
      const i = (y * 宽度 + x) * 4
      数据[i] = Math.floor(最终色.r * 255)
      数据[i + 1] = Math.floor(最终色.g * 255)
      数据[i + 2] = Math.floor(最终色.b * 255)
      数据[i + 3] = 255
    }
  }

  const 贴图 = new THREE.DataTexture(数据, 宽度, 高度, THREE.RGBAFormat)
  贴图.mapping = THREE.EquirectangularReflectionMapping
  贴图.needsUpdate = true
  return 贴图
}

export default function HeroText3D() {
  const 网格引用 = useRef()
  const { gl, scene } = useThree()
  const 是否WebGPU = gl.isWebGPURenderer === true

  useEffect(() => {
    const 贴图 = 创建环境贴图()
    scene.environment = 贴图
    return () => {
      scene.environment = null
      贴图.dispose()
    }
  }, [scene])

  const 基础材质属性 = useMemo(
    () => ({
      color: new THREE.Color('#aaccff'),
      roughness: 0.15,
      ior: 1.5,
      envMapIntensity: 1.2,
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
