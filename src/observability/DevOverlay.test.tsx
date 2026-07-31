import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { RingBuffer, LogCategory } from './ringBuffer'
import { DevOverlay } from './DevOverlay'
import { createFpsTracker, formatMemory, isDev } from './devUtils'

vi.mock('./devUtils', async () => {
  const actual = await vi.importActual<typeof import('./devUtils')>('./devUtils')
  return {
    ...actual,
    isDev: vi.fn(),
  }
})

function mockRaf() {
  let rafId = 0
  const fns = new Map<number, FrameRequestCallback>()

  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
    rafId++
    fns.set(rafId, cb as FrameRequestCallback)
    return rafId
  })

  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id) => {
    fns.delete(id)
  })

  return {
    advance: (time: number) => {
      const copy = [...fns.entries()]
      fns.clear()
      for (const [, cb] of copy) {
        cb(time)
      }
    },
    restore: () => {
      vi.mocked(globalThis.requestAnimationFrame).mockRestore()
      vi.mocked(globalThis.cancelAnimationFrame).mockRestore()
    },
  }
}

describe('DevOverlay', () => {
  let ring: RingBuffer

  beforeEach(() => {
    vi.mocked(isDev).mockReturnValue(true)
    ring = new RingBuffer(4096)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing in PROD', () => {
    vi.mocked(isDev).mockReturnValue(false)
    const { container } = render(<DevOverlay ringBuffer={ring} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders in DEV', () => {
    render(<DevOverlay ringBuffer={ring} />)
    expect(screen.getByText('Dev Overlay')).toBeInTheDocument()
  })

  it('toggles with Ctrl+Shift+D', () => {
    render(<DevOverlay ringBuffer={ring} />)
    expect(screen.getByText('Dev Overlay')).toBeInTheDocument()
    fireEvent.keyDown(window, { ctrlKey: true, shiftKey: true, code: 'KeyD' })
    expect(screen.queryByText('Dev Overlay')).not.toBeInTheDocument()
    fireEvent.keyDown(window, { ctrlKey: true, shiftKey: true, code: 'KeyD' })
    expect(screen.getByText('Dev Overlay')).toBeInTheDocument()
  })

  it('closes with close button', () => {
    render(<DevOverlay ringBuffer={ring} />)
    const closeBtn = screen.getByTitle('关闭')
    fireEvent.click(closeBtn)
    expect(screen.queryByText('Dev Overlay')).not.toBeInTheDocument()
  })

  it('displays logs from RingBuffer subscription', async () => {
    render(<DevOverlay ringBuffer={ring} />)
    await act(async () => {
      ring.write('info', LogCategory.Runtime, 'test message')
    })
    expect(screen.getByText('test message')).toBeInTheDocument()
  })

  it('shows different levels with colored badges', async () => {
    render(<DevOverlay ringBuffer={ring} />)
    await act(async () => {
      ring.write('debug', LogCategory.Runtime, 'debug msg')
      ring.write('info', LogCategory.Runtime, 'info msg')
      ring.write('warn', LogCategory.Runtime, 'warn msg')
      ring.write('error', LogCategory.Runtime, 'error msg')
      ring.write('fatal', LogCategory.Runtime, 'fatal msg')
    })
    expect(screen.getByText('debug msg')).toBeInTheDocument()
    expect(screen.getByText('info msg')).toBeInTheDocument()
    expect(screen.getByText('warn msg')).toBeInTheDocument()
    expect(screen.getByText('error msg')).toBeInTheDocument()
    expect(screen.getByText('fatal msg')).toBeInTheDocument()
  })

  it('filters logs by level', async () => {
    render(<DevOverlay ringBuffer={ring} />)
    await act(async () => {
      ring.write('info', LogCategory.Runtime, 'info msg')
      ring.write('error', LogCategory.Runtime, 'error msg')
    })
    expect(screen.getByText('info msg')).toBeInTheDocument()
    expect(screen.getByText('error msg')).toBeInTheDocument()
    const infoBtn = screen.getByText('info')
    await act(async () => {
      fireEvent.click(infoBtn)
    })
    expect(screen.queryByText('info msg')).not.toBeInTheDocument()
    expect(screen.getByText('error msg')).toBeInTheDocument()
  })

  it('searches logs by keyword', async () => {
    render(<DevOverlay ringBuffer={ring} />)
    await act(async () => {
      ring.write('info', LogCategory.Runtime, 'login successful')
      ring.write('error', LogCategory.Runtime, 'database connection failed')
    })
    expect(screen.getByText('login successful')).toBeInTheDocument()
    expect(screen.getByText('database connection failed')).toBeInTheDocument()
    const searchInput = screen.getByPlaceholderText('搜索...')
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'login' } })
    })
    expect(screen.getByText('login successful')).toBeInTheDocument()
    expect(screen.queryByText('database connection failed')).not.toBeInTheDocument()
  })

  it('expands log entry on click', async () => {
    render(<DevOverlay ringBuffer={ring} />)
    await act(async () => {
      ring.write('info', LogCategory.Runtime, 'clickable msg', { userId: 42 })
    })
    const entry = screen.getByText('clickable msg')
    await act(async () => {
      fireEvent.click(entry)
    })
    expect(screen.getByText(/"userId"/)).toBeInTheDocument()
  })

  it('shows FPS in status bar', () => {
    render(<DevOverlay ringBuffer={ring} />)
    expect(screen.getByText(/FPS:/)).toBeInTheDocument()
  })
})

describe('createFpsTracker', () => {
  let raf: ReturnType<typeof mockRaf>

  beforeEach(() => {
    raf = mockRaf()
  })

  afterEach(() => {
    raf.restore()
    vi.restoreAllMocks()
  })

  it('tracks fps over time', () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    const tracker = createFpsTracker()
    tracker.start()

    const { update } = tracker
    let r = update()
    expect(r.fps).toBe(0)

    now = 200
    raf.advance(200)
    r = update()
    expect(r.fps).toBe(0)

    now = 600
    raf.advance(600)
    r = update()
    expect(r.fps).toBeGreaterThan(0)

    tracker.stop()
  })

  it('stops updating after stop()', () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    const tracker = createFpsTracker()
    tracker.start()
    tracker.stop()

    now = 600
    raf.advance(600)
    const r = tracker.update()
    expect(r.fps).toBe(0)
  })
})

describe('formatMemory', () => {
  it('formats bytes to MB', () => {
    expect(formatMemory(1048576)).toBe('1.0MB')
    expect(formatMemory(5242880)).toBe('5.0MB')
    expect(formatMemory(0)).toBe('N/A')
    expect(formatMemory(undefined)).toBe('N/A')
  })
})
