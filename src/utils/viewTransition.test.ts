import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isViewTransitionSupported, startViewTransition } from './viewTransition'

describe('viewTransition', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      ...document,
      startViewTransition: undefined,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('detects unsupported view transition', () => {
    expect(isViewTransitionSupported()).toBe(false)
  })

  it('falls back to callback when unsupported', async () => {
    const callback = vi.fn()
    await startViewTransition(callback)
    expect(callback).toHaveBeenCalled()
  })

  it('uses document.startViewTransition when available', async () => {
    const callback = vi.fn()
    const startViewTransitionMock = vi.fn((cb) => {
      cb()
      return {
        updateCallbackDone: Promise.resolve(),
        ready: Promise.resolve(),
      }
    })

    vi.stubGlobal('document', {
      ...document,
      startViewTransition: startViewTransitionMock,
    })

    await startViewTransition(callback)
    expect(startViewTransitionMock).toHaveBeenCalled()
    expect(callback).toHaveBeenCalled()
  })
})
