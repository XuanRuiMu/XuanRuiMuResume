import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'

const HDR路径 = '/env/studio.hdr'
const 背景色 = '#05070d'

const 底部色 = new THREE.Color(0.02, 0.04, 0.08)
const 顶部色 = new THREE.Color(0.18, 0.28, 0.42)
const 水平光色 = new THREE.Color(0.06, 0.08, 0.12)

const 光斑列表 = [
  { u: 0.22, v: 0.78, 半径: 0.09, 颜色: new THREE.Color(2.6, 1.7, 0.9), 强度: 5.0 },
  { u: 0.78, v: 0.74, 半径: 0.07, 颜色: new THREE.Color(0.7, 2.3, 3.0), 强度: 4.0 },
  { u: 0.5, v: 0.9, 半径: 0.055, 颜色: new THREE.Color(2.0, 1.1, 2.8), 强度: 3.5 },
  { u: 0.08, v: 0.55, 半径: 0.14, 颜色: new THREE.Color(1.4, 1.7, 2.1), 强度: 1.4 },
  { u: 0.92, v: 0.52, 半径: 0.12, 颜色: new THREE.Color(1.6, 1.5, 1.9), 强度: 1.2 },
]

function 计算像素颜色(u, v, 目标颜色) {
  const 天顶因子 = Math.pow(1 - v, 1.55)
  目标颜色.lerpColors(底部色, 顶部色, 天顶因子)

  const 水平因子 = Math.exp(-Math.pow((v - 0.36) / 0.1, 2))
  const 水平贡献 = 水平光色.clone().multiplyScalar(水平因子 * 0.45)
  目标颜色.add(水平贡献)

  for (const 光斑 of 光斑列表) {
    const du = Math.min(Math.abs(u - 光斑.u), 1 - Math.abs(u - 光斑.u))
    const dv = v - 光斑.v
    const 距离 = Math.sqrt(du * du + dv * dv)
    const 衰减 = Math.exp(-Math.pow(距离 / 光斑.半径, 2))
    const 光贡献 = 光斑.颜色.clone().multiplyScalar(衰减 * 光斑.强度)
    目标颜色.add(光贡献)
  }
}

function 创建程序化HDR贴图() {
  const 宽度 = 512
  const 高度 = 256
  const 数据 = new Float32Array(宽度 * 高度 * 4)
  const 像素色 = new THREE.Color()

  for (let y = 0; y < 高度; y++) {
    const v = 1 - y / (高度 - 1)
    for (let x = 0; x < 宽度; x++) {
      const u = x / (宽度 - 1)
      计算像素颜色(u, v, 像素色)
      const i = (y * 宽度 + x) * 4
      数据[i] = 像素色.r
      数据[i + 1] = 像素色.g
      数据[i + 2] = 像素色.b
      数据[i + 3] = 1
    }
  }

  const 贴图 = new THREE.DataTexture(数据, 宽度, 高度, THREE.RGBAFormat, THREE.FloatType)
  贴图.mapping = THREE.EquirectangularReflectionMapping
  贴图.needsUpdate = true
  return 贴图
}

export function EnvironmentProbe() {
  const { scene } = useThree()
  const 贴图引用 = useRef(null)

  useEffect(() => {
    let 已卸载 = false

    const loader = new HDRLoader()
    loader.load(
      HDR路径,
      (贴图) => {
        if (已卸载) {
          贴图.dispose()
          return
        }
        贴图.mapping = THREE.EquirectangularReflectionMapping
        贴图引用.current = 贴图
        scene.environment = 贴图
        scene.background = new THREE.Color(背景色)
      },
      undefined,
      (错误) => {
        if (已卸载) return
        console.warn('HDR 环境贴图加载失败，回退到程序化生成：', 错误)
        const 贴图 = 创建程序化HDR贴图()
        贴图引用.current = 贴图
        scene.environment = 贴图
        scene.background = new THREE.Color(背景色)
      }
    )

    return () => {
      已卸载 = true
      scene.environment = null
      scene.background = null
      if (贴图引用.current) {
        贴图引用.current.dispose()
        贴图引用.current = null
      }
    }
  }, [scene])

  return null
}
