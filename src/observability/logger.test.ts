import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from './logger'

describe('logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should generate a session id', () => {
    const sessionId = logger.getSessionId()
    expect(sessionId).toBeTruthy()
    expect(typeof sessionId).toBe('string')
  })

  it('should emit info logs with context', () => {
    logger.info('test message', { key: 'value' })
    expect(consoleSpy).toHaveBeenCalled()
    const call = consoleSpy.mock.calls[0] as unknown[]
    expect(call[0]).toContain('INFO')
    expect(call[1]).toBe('test message')
  })

  it('should support debug/warn/error/fatal levels without throwing', () => {
    expect(() => logger.debug('d')).not.toThrow()
    expect(() => logger.warn('w')).not.toThrow()
    expect(() => logger.error('e')).not.toThrow()
    expect(() => logger.fatal('f')).not.toThrow()
  })
})
