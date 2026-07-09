import '@testing-library/jest-dom'
import { vi } from 'vitest'

// jsdom / node 测试环境均提供 ResizeObserver 最小实现，Three.js / R3F / recharts 依赖它
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
globalThis.ResizeObserver = MockResizeObserver
if (typeof window !== 'undefined') {
  window.ResizeObserver = MockResizeObserver
}

// jsdom 不实现 Canvas getContext，提供最小 WebGL mock 以支持 Three.js 相关组件测试
if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (contextId, options) {
    if (contextId === 'webgl' || contextId === 'webgl2' || contextId === 'experimental-webgl') {
      return {
        getExtension: vi.fn((name) => {
          if (name === 'WEBGL_debug_renderer_info') {
            return {
              UNMASKED_RENDERER_WEBGL: 0x9247,
              UNMASKED_VENDOR_WEBGL: 0x9245,
            }
          }
          return null
        }),
        getParameter: vi.fn((param) => {
          if (param === 0x9247) return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Direct3D11)'
          if (param === 0x9245) return 'Google Inc.'
          return 0
        }),
        createShader: vi.fn(),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        createProgram: vi.fn(),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        useProgram: vi.fn(),
        createBuffer: vi.fn(),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
        viewport: vi.fn(),
        clear: vi.fn(),
        clearColor: vi.fn(),
        drawArrays: vi.fn(),
        drawElements: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        blendFunc: vi.fn(),
        depthFunc: vi.fn(),
        enableVertexAttribArray: vi.fn(),
        vertexAttribPointer: vi.fn(),
        getAttribLocation: vi.fn(() => 0),
        getUniformLocation: vi.fn(() => ({})),
        uniformMatrix4fv: vi.fn(),
        uniform1f: vi.fn(),
        uniform2f: vi.fn(),
        uniform3f: vi.fn(),
        uniform4f: vi.fn(),
        uniform1i: vi.fn(),
      }
    }
    return originalGetContext.call(this, contextId, options)
  }
}

// Service Worker 在 jsdom 中不可用，提供最小 mock
const serviceWorkerListeners = new Map()
Object.defineProperty(global.navigator, 'serviceWorker', {
  writable: true,
  configurable: true,
  value: {
    register: vi.fn(() =>
      Promise.resolve({
        scope: '/',
        update: vi.fn(),
        unregister: vi.fn(),
      })
    ),
    ready: Promise.resolve({
      scope: '/',
      active: null,
    }),
    controller: null,
    addEventListener: (event, handler) => {
      serviceWorkerListeners.set(event, handler)
    },
    __triggerMessage: (data) => {
      const handler = serviceWorkerListeners.get('message')
      if (handler) handler({ data })
    },
  },
})
