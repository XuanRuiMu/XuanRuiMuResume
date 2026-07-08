import type { ReactElement } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SkillRadarChart } from './SkillRadarChart'
import { skillMetrics } from '../../data/skillMetrics'
import { t } from '../../i18n/translations'

function 渲染带尺寸(节点: ReactElement) {
  return render(<div style={{ width: 400, height: 400 }}>{节点}</div>)
}

describe('SkillRadarChart', () => {
  beforeEach(() => {
    global.ResizeObserver = vi.fn((callback) => ({
      observe: vi.fn((target) => {
        callback([{ contentRect: { width: 400, height: 400 }, target }])
      }),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as typeof ResizeObserver

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
  })

  it('renders all dimension labels', () => {
    渲染带尺寸(<SkillRadarChart />)
    for (const metric of skillMetrics) {
      expect(screen.getByText(t(metric.dimensionKey))).toBeInTheDocument()
    }
  })

  it('renders all radar points', () => {
    渲染带尺寸(<SkillRadarChart />)
    const points = screen.getAllByTestId(/radar-point-/)
    expect(points).toHaveLength(skillMetrics.length)
  })

  it('shows detail panel on hover', () => {
    渲染带尺寸(<SkillRadarChart />)
    const firstPoint = screen.getByTestId('radar-point-0')
    fireEvent.mouseEnter(firstPoint)
    expect(screen.getByTestId('radar-detail-label')).toHaveTextContent(t(skillMetrics[0].dimensionKey))
    expect(screen.getByTestId('radar-detail-score')).toHaveTextContent(String(skillMetrics[0].score))
    expect(screen.getByTestId('radar-detail-desc')).toHaveTextContent(t(skillMetrics[0].descriptionKey))
  })
})
