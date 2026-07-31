import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { RingBuffer, type LogEntry, type LogLevel } from './ringBuffer'
import { LogStore } from './persistence'
import { createFpsTracker, formatMemory, isDev } from './devUtils'
import { encode } from '@msgpack/msgpack'

const LEVEL_COLORS: Record<string, string> = {
  debug: '#888',
  info: '#4a9eff',
  warn: '#ffa726',
  error: '#ef5350',
  fatal: '#8d1a1a',
}

const LEVEL_BG: Record<string, string> = {
  debug: 'rgba(136,136,136,0.15)',
  info: 'rgba(74,158,255,0.15)',
  warn: 'rgba(255,167,38,0.15)',
  error: 'rgba(239,83,80,0.15)',
  fatal: 'rgba(141,26,26,0.15)',
}

const ALL_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal']

function formatTime(ts: bigint): string {
  const d = new Date(Number(ts))
  return d.toTimeString().slice(0, 8)
}

export interface DevOverlayProps {
  ringBuffer?: RingBuffer
  logStore?: LogStore
}

export function DevOverlay({ ringBuffer: externalRb, logStore: externalLs }: DevOverlayProps): ReactNode {
  const rb = useRef(externalRb ?? new RingBuffer())
  const ls = useRef(externalLs ?? new LogStore('dev-overlay'))

  const [visible, setVisible] = useState(true)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [activeLevels, setActiveLevels] = useState<Set<LogLevel>>(new Set(ALL_LEVELS))
  const [search, setSearch] = useState('')
  const [fps, setFps] = useState(0)
  const [frameTime, setFrameTime] = useState(0)
  const [memory, setMemory] = useState('N/A')

  const posRef = useRef({ x: 0, y: 0 })
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const fpsTracker = useRef(createFpsTracker())
  const listRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<Record<string, number>>({ debug: 0, info: 0, warn: 0, error: 0, fatal: 0 })

  const filtered = logs.filter((e) => {
    if (!activeLevels.has(e.level)) return false
    if (search && !e.message.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  useEffect(() => {
    const ft = fpsTracker.current
    ft.start()

    let memTimer: ReturnType<typeof setInterval> | undefined
    if ((performance as any).memory) {
      memTimer = setInterval(() => {
        const m = (performance as any).memory
        setMemory(formatMemory(m?.usedJSHeapSize))
      }, 2000)
    }

    return () => {
      ft.stop()
      if (memTimer) clearInterval(memTimer)
    }
  }, [])

  useEffect(() => {
    const ft = fpsTracker.current
    let rafId: number

    function pollFps() {
      const r = ft.update()
      setFps(r.fps)
      setFrameTime(r.frameTime)
      rafId = requestAnimationFrame(pollFps)
    }

    rafId = requestAnimationFrame(pollFps)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const logsRef = useRef(logs)
  logsRef.current = logs

  useEffect(() => {
    const unsub = rb.current.subscribe((entry: LogEntry) => {
      statsRef.current[entry.level]++
      setLogs((prev) => {
        const next = [...prev, entry]
        if (next.length > 200) return next.slice(-200)
        return next
      })
    })

    return unsub
  }, [])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight
      }
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [filtered.length, scrollToBottom])

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
      e.preventDefault()
      setVisible((v) => !v)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const toggleLevel = useCallback((level: LogLevel) => {
    setActiveLevels((prev) => {
      const next = new Set(prev)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  }, [])

  const handleExport = useCallback(async () => {
    const entries = await ls.current.readEntries(5000)
    const encoded = encode(
      entries.map((e) => ({
        ...e,
        timestamp: Number(e.timestamp),
      }))
    )
    const blob = new Blob([encoded], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${Date.now()}.msgpack`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, px: posRef.current.x, py: posRef.current.y }
    const onMove = (ev: PointerEvent) => {
      if (!dragging.current) return
      const dx = ev.clientX - dragStart.current.x
      const dy = ev.clientY - dragStart.current.y
      posRef.current = { x: dragStart.current.px + dx, y: dragStart.current.py + dy }
      setPos({ ...posRef.current })
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  if (!isDev() || !visible) return null

  const stats = statsRef.current
  const statTotal = ALL_LEVELS.reduce((s, l) => s + stats[l], 0)

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        top: 16,
        transform: pos.x !== 0 || pos.y !== 0 ? `translate(${pos.x}px, ${pos.y}px)` : undefined,
        width: 420,
        maxHeight: '70vh',
        zIndex: 99999,
        background: 'rgba(10,10,20,0.92)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        color: '#e0e0e0',
        fontFamily: "'SF Mono', 'Cascadia Code', 'Consolas', monospace",
        fontSize: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          cursor: 'grab',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
        onPointerDown={handlePointerDown}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>Dev Overlay</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleExport}
            title="导出日志(msgpack)"
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              fontSize: 14,
              padding: '2px 4px',
            }}
          >
            {'\u2B73'}
          </button>
          <button
            onClick={() => setVisible(false)}
            title="关闭"
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              fontSize: 14,
              padding: '2px 4px',
            }}
          >
            {'\u2715'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '8px 12px' }}>
        <div
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          <div style={{ color: '#aaa', fontSize: 10, marginBottom: 4 }}>FPS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                flex: 1,
                height: 8,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(fps / 60, 1) * 100}%`,
                  height: '100%',
                  background: fps >= 55 ? '#4caf50' : fps >= 30 ? '#ffa726' : '#ef5350',
                  borderRadius: 4,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', minWidth: 32, textAlign: 'right' }}>
              {fps}
            </span>
          </div>
          <div style={{ color: '#888', fontSize: 10, marginTop: 2 }}>帧时间: {frameTime}ms</div>
        </div>

        <div
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          <div style={{ color: '#aaa', fontSize: 10, marginBottom: 4 }}>日志统计</div>
          {ALL_LEVELS.map((l) => (
            <div
              key={l}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: LEVEL_COLORS[l],
                lineHeight: '16px',
              }}
            >
              <span style={{ fontWeight: 600 }}>{l.toUpperCase().slice(0, 4)}</span>
              <span>{stats[l].toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 12px 4px', color: '#666', fontSize: 10 }}>
        实时日志流 ({filtered.length}/{statTotal})
      </div>

      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 12px',
          minHeight: 120,
          maxHeight: 300,
        }}
      >
        {filtered.length === 0 && (
          <div style={{ color: '#555', fontSize: 11, padding: '20px 0', textAlign: 'center' }}>
            {statTotal === 0 ? '等待日志...' : '无匹配日志'}
          </div>
        )}
        {filtered.slice(-50).map((entry, i) => {
          const idx = logs.indexOf(entry)
          const expanded = expandedIdx === idx
          return (
            <div
              key={`${Number(entry.timestamp)}-${i}`}
              onClick={() => setExpandedIdx(expanded ? null : idx)}
              style={{
                padding: '3px 6px',
                borderRadius: 4,
                cursor: 'pointer',
                background: expanded ? LEVEL_BG[entry.level] : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <span style={{ color: '#666', marginRight: 6 }}>{formatTime(entry.timestamp)}</span>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0 4px',
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  background: LEVEL_BG[entry.level],
                  color: LEVEL_COLORS[entry.level],
                  marginRight: 6,
                }}
              >
                {entry.level.toUpperCase()}
              </span>
              <span style={{ wordBreak: 'break-all' }}>{entry.message}</span>
              {expanded && entry.context && (
                <div
                  style={{
                    marginTop: 4,
                    padding: '4px 8px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 4,
                    fontSize: 10,
                    color: '#aaa',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {JSON.stringify(entry.context, null, 2)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div
        style={{
          padding: '6px 12px',
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', gap: 3 }}>
          {ALL_LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => toggleLevel(l)}
              style={{
                padding: '2px 6px',
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 4,
                border: `1px solid ${activeLevels.has(l) ? LEVEL_COLORS[l] : 'transparent'}`,
                background: activeLevels.has(l) ? LEVEL_BG[l] : 'rgba(255,255,255,0.04)',
                color: activeLevels.has(l) ? LEVEL_COLORS[l] : '#666',
                cursor: 'pointer',
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <input
          placeholder="搜索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 80,
            padding: '3px 8px',
            fontSize: 11,
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            color: '#e0e0e0',
            outline: 'none',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '4px 12px',
          fontSize: 10,
          color: '#555',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span>FPS: {fps}</span>
        <span>帧时间: {frameTime}ms</span>
        <span>内存: {memory}</span>
      </div>
    </div>
  )
}
