import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkillGalaxyFallback } from './SkillGalaxyFallback'

describe('SkillGalaxyFallback', () => {
  it('renders fallback container', () => {
    render(<SkillGalaxyFallback />)
    expect(screen.getByTestId('skill-galaxy-fallback')).toBeInTheDocument()
  })

  it('is hidden from accessibility tree', () => {
    render(<SkillGalaxyFallback />)
    const element = screen.getByTestId('skill-galaxy-fallback')
    expect(element).toHaveAttribute('aria-hidden', 'true')
  })
})
