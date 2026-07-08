import '@testing-library/jest-dom'
import { vi } from 'vitest'

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
