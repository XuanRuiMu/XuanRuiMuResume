export function createFpsTracker(): {
  update: () => { fps: number; frameTime: number }
  start: () => void
  stop: () => void
} {
  let lastTime = performance.now()
  let frames = 0
  let fps = 0
  let frameTime = 0
  let rafId: number | null = null
  let running = false

  function loop(now: number): void {
    if (!running) return
    const delta = now - lastTime
    frames++

    if (delta >= 500) {
      fps = Math.round((frames * 1000) / delta)
      frameTime = Math.round((delta / frames) * 10) / 10
      frames = 0
      lastTime = now
    }

    rafId = requestAnimationFrame(loop)
  }

  return {
    update: () => ({ fps, frameTime }),
    start: () => {
      if (running) return
      running = true
      lastTime = performance.now()
      frames = 0
      rafId = requestAnimationFrame(loop)
    },
    stop: () => {
      running = false
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    },
  }
}

export function formatMemory(bytes?: number): string {
  if (bytes === undefined || bytes === 0) return 'N/A'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

export function isDev(): boolean {
  return import.meta.env.DEV
}
