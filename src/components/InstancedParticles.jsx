import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { NodeMaterial } from 'three/webgpu'
import {
  vec3,
  vec4,
  float,
  uniform,
  sin,
  length,
  mix,
  attribute,
  uv,
  positionLocal,
} from 'three/tsl'
import { useTheaterStore } from '../store/useTheaterStore'

const 默认配置 = {
  数量: 20000,
  分布宽度: 60,
  分布高度: 30,
  分布中心Y: 4,
  基础尺寸: 0.035,
  尺寸变化: 0.06,
  漂移速度: 0.05,
  浮动速度: 0.4,
  浮动幅度: 0.25,
  鼠标影响: 0.4,
  滚动影响: 1.5,
  蓝紫色: [0.45, 0.58, 0.98],
  暖金色: [1.0, 0.74, 0.32],
}

function 生成粒子属性(配置) {
  const 数量 = 配置.数量
  const 偏移 = new Float32Array(数量 * 3)
  const 缩放 = new Float32Array(数量)
  const 相位 = new Float32Array(数量)
  const 速度 = new Float32Array(数量 * 3)
  const 颜色混合 = new Float32Array(数量)

  for (let i = 0; i < 数量; i++) {
    偏移[i * 3] = (Math.random() - 0.5) * 配置.分布宽度
    偏移[i * 3 + 1] = (Math.random() - 0.5) * 配置.分布高度 + 配置.分布中心Y
    偏移[i * 3 + 2] = (Math.random() - 0.5) * 配置.分布宽度

    缩放[i] = 配置.基础尺寸 + Math.random() * 配置.尺寸变化
    相位[i] = Math.random() * Math.PI * 2

    速度[i * 3] = (Math.random() - 0.5) * 0.02
    速度[i * 3 + 1] = (Math.random() - 0.5) * 0.01
    速度[i * 3 + 2] = (Math.random() - 0.5) * 0.02

    颜色混合[i] = Math.random()
  }

  return { 偏移, 缩放, 相位, 速度, 颜色混合 }
}

const WebGL顶点着色器 = /* glsl */ `
  attribute vec3 aOffset;
  attribute float aScale;
  attribute float aPhase;
  attribute vec3 aVelocity;
  attribute float aColorMix;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uScroll;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vColorMix;

  void main() {
    vUv = uv;
    vColorMix = aColorMix;

    vec3 center = aOffset;
    center += aVelocity * uTime * 0.05;
    center.y += sin(uTime * 0.4 + aPhase) * 0.25;
    center.x += uMouse.x * 0.4 + uScroll * 1.5;
    center.z += uMouse.y * 0.4;

    vec3 viewPos = (viewMatrix * vec4(center, 1.0)).xyz;
    viewPos.xy += position.xy * aScale;

    gl_Position = projectionMatrix * vec4(viewPos, 1.0);
    vAlpha = 0.55 + 0.22 * sin(uTime + aPhase);
  }
`

const WebGL片段着色器 = /* glsl */ `
  uniform vec3 uBluePurple;
  uniform vec3 uWarmGold;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vColorMix;

  void main() {
    vec2 coord = vUv * 2.0 - 1.0;
    float dist = length(coord);
    if (dist > 1.0) discard;
    float alpha = (1.0 - dist) * vAlpha;
    vec3 color = mix(uBluePurple, uWarmGold, vColorMix);
    gl_FragColor = vec4(color, alpha);
  }
`

function 创建WebGL材质(配置) {
  const 材质 = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uBluePurple: { value: new THREE.Color(...配置.蓝紫色) },
      uWarmGold: { value: new THREE.Color(...配置.暖金色) },
    },
    vertexShader: WebGL顶点着色器,
    fragmentShader: WebGL片段着色器,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  return [材质.uniforms.uTime, 材质.uniforms.uMouse, 材质.uniforms.uScroll, 材质]
}

function 创建WebGPU材质(配置) {
  const 时间 = uniform(0)
  const 鼠标 = uniform(new THREE.Vector2(0, 0))
  const 滚动 = uniform(0)
  const 相机右 = uniform(new THREE.Vector3(1, 0, 0))
  const 相机上 = uniform(new THREE.Vector3(0, 1, 0))

  const 偏移属性 = attribute('aOffset', 'vec3')
  const 缩放属性 = attribute('aScale', 'float')
  const 相位属性 = attribute('aPhase', 'float')
  const 速度属性 = attribute('aVelocity', 'vec3')
  const 颜色混合属性 = attribute('aColorMix', 'float')

  const 中心 = 偏移属性
    .add(速度属性.mul(时间).mul(0.05))
    .add(vec3(0, sin(时间.mul(0.4).add(相位属性)).mul(0.25), 0))
    .add(vec3(鼠标.x, 0, 鼠标.y).mul(0.4))
    .add(vec3(滚动, 0, 0).mul(1.5))

  const 本地偏移 = 相机右
    .mul(positionLocal.x.mul(缩放属性))
    .add(相机上.mul(positionLocal.y.mul(缩放属性)))
  const 世界位置 = 中心.add(本地偏移)

  const 材质 = new NodeMaterial()
  材质.positionNode = vec4(世界位置, 1)
  材质.lights = false
  材质.depthWrite = false
  材质.transparent = true
  材质.blending = THREE.AdditiveBlending

  const uv2 = uv().mul(2).sub(1)
  const 距离 = length(uv2)
  const 透明度 = float(1).sub(距离).mul(float(0.55).add(sin(时间.add(相位属性)).mul(0.22)))
  const 颜色 = mix(vec3(...配置.蓝紫色), vec3(...配置.暖金色), 颜色混合属性)

  材质.colorNode = 颜色
  材质.opacityNode = 透明度

  return [时间, 鼠标, 滚动, 相机右, 相机上, 材质]
}

export function InstancedParticles({ 配置: 用户配置 } = {}) {
  const 配置 = useMemo(() => ({ ...默认配置, ...用户配置 }), [用户配置])
  const { gl, pointer, camera } = useThree()
  const 是否WebGPU = gl.isWebGPURenderer === true
  const 滚动进度 = useTheaterStore((s) => s.scrollProgress)

  const { 几何体, 网格, 时间, 鼠标, 滚动, 相机右, 相机上 } = useMemo(() => {
    const { 偏移, 缩放, 相位, 速度, 颜色混合 } = 生成粒子属性(配置)
    const 几何体 = new THREE.PlaneGeometry(1, 1)
    几何体.setAttribute('aOffset', new THREE.InstancedBufferAttribute(偏移, 3))
    几何体.setAttribute('aScale', new THREE.InstancedBufferAttribute(缩放, 1))
    几何体.setAttribute('aPhase', new THREE.InstancedBufferAttribute(相位, 1))
    几何体.setAttribute('aVelocity', new THREE.InstancedBufferAttribute(速度, 3))
    几何体.setAttribute('aColorMix', new THREE.InstancedBufferAttribute(颜色混合, 1))

    let 时间, 鼠标, 滚动, 相机右, 相机上, 材质
    if (是否WebGPU) {
      ;[时间, 鼠标, 滚动, 相机右, 相机上, 材质] = 创建WebGPU材质(配置)
    } else {
      ;[时间, 鼠标, 滚动, 材质] = 创建WebGL材质(配置)
      相机右 = null
      相机上 = null
    }

    const 网格 = new THREE.InstancedMesh(几何体, 材质, 配置.数量)
    网格.frustumCulled = false
    return { 几何体, 网格, 时间, 鼠标, 滚动, 相机右, 相机上, 材质 }
  }, [配置, 是否WebGPU])

  const uniformRef = useRef({ 时间, 鼠标, 滚动, 相机右, 相机上 })
  useEffect(() => {
    uniformRef.current = { 时间, 鼠标, 滚动, 相机右, 相机上 }
  }, [时间, 鼠标, 滚动, 相机右, 相机上])

  useFrame((state) => {
    const { 时间: uTime, 鼠标: uMouse, 滚动: uScroll, 相机右: uCameraRight, 相机上: uCameraUp } = uniformRef.current
    if (uTime) uTime.value = state.clock.elapsedTime
    if (uMouse) {
      uMouse.value.x = pointer.x * 0.4
      uMouse.value.y = -pointer.y * 0.4
    }
    if (uScroll) uScroll.value = 滚动进度 * 1.5
    if (uCameraRight && uCameraUp) {
      const e = camera.matrixWorld.elements
      uCameraRight.value.set(e[0], e[1], e[2])
      uCameraUp.value.set(e[4], e[5], e[6])
    }
  })

  useEffect(() => {
    return () => {
      几何体.dispose()
      网格.material.dispose()
    }
  }, [几何体, 网格])

  return <primitive object={网格} />
}
