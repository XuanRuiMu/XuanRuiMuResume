/**
 * Three.js WebGPU / TSL 子模块类型声明
 * three 的 package.json 中 exports 将 './webgpu' 映射到 build/three.webgpu.js，
 * './tsl' 映射到 build/three.tsl.js。此处补充对应的 TypeScript 模块声明，
 * 使 R3F 中异步创建 WebGPURenderer 与 TSL 节点编程通过类型检查。
 */

import type * as THREE from 'three'

declare module 'three/webgpu' {
  export * from 'three'

  export class WebGPURenderer {
    constructor(parameters?: THREE.WebGLRendererParameters)
    init(): Promise<void>
    render(scene: THREE.Object3D, camera: THREE.Camera): void
    setSize(width: number, height: number, updateStyle?: boolean): void
    setPixelRatio(ratio: number): void
    dispose(): void
  }

  export class PointsNodeMaterial extends THREE.PointsMaterial {
    colorNode?: unknown
    sizeNode?: unknown
    opacityNode?: unknown
    positionNode?: unknown
    constructor(
      parameters?: THREE.PointsMaterialParameters & {
        colorNode?: unknown
        sizeNode?: unknown
        opacityNode?: unknown
        positionNode?: unknown
      }
    )
  }
}

declare module 'three/tsl' {
  export const time: unknown
  export function attribute(name: string, type: string): unknown
  export function add(...args: unknown[]): unknown
  export function mul(...args: unknown[]): unknown
  export function sin(arg: unknown): unknown
  export function float(arg: unknown): unknown
  export function vec4(...args: unknown[]): unknown
  export function vec3(...args: unknown[]): unknown
}
