import type { LogLevel, LogContext, StructuredLogEntry, TelemetryCollector } from './types'

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
}

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function getCurrentLevel(): LogLevel {
  if (import.meta.env.DEV) return 'debug'
  const env = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_LOG_LEVEL : undefined
  if (env && env in LOG_LEVEL_PRIORITY) return env as LogLevel
  return 'info'
}

class Logger {
  private sessionId: string
  private collectors: TelemetryCollector[] = []
  private level: LogLevel

  constructor() {
    this.sessionId = generateSessionId()
    this.level = getCurrentLevel()
  }

  registerCollector(collector: TelemetryCollector): void {
    this.collectors.push(collector)
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.level]
  }

  private buildEntry(level: LogLevel, message: string, context?: LogContext): StructuredLogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      sessionId: this.sessionId,
    }
  }

  private emit(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return

    const entry = this.buildEntry(level, message, context)

    if (import.meta.env.DEV || level === 'error' || level === 'fatal') {
      const consoleMethod = level === 'fatal' ? 'error' : level === 'debug' ? 'debug' : level
      // eslint-disable-next-line no-console
      console[consoleMethod](`[${entry.level.toUpperCase()}]`, entry.message, entry.context ?? '')
    }

    this.collectors.forEach((collector) => {
      try {
        collector.log(level, message, context)
      } catch (err) {
        // 收集器自身失败不应影响业务
        console.warn('Telemetry collector failed:', err)
      }
    })
  }

  debug(message: string, context?: LogContext): void {
    this.emit('debug', message, context)
  }

  info(message: string, context?: LogContext): void {
    this.emit('info', message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.emit('warn', message, context)
  }

  error(message: string, context?: LogContext): void {
    this.emit('error', message, context)
  }

  fatal(message: string, context?: LogContext): void {
    this.emit('fatal', message, context)
  }

  getSessionId(): string {
    return this.sessionId
  }
}

export const logger = new Logger()
