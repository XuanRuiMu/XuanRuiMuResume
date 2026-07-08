import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFocusTrap } from './useFocusTrap'

describe('useFocusTrap', () => {
  it('returns a ref without crashing', () => {
    const { result } = renderHook(() => useFocusTrap(true))
    expect(result.current).toBeDefined()
  })
})
