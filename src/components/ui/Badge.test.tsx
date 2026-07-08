import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>badge</Badge>)
    expect(screen.getByText('badge')).toBeInTheDocument()
  })

  it.each([
    ['cyan', 'bg-cyan-500/15'],
    ['orange', 'bg-orange-500/15'],
    ['purple', 'bg-purple-500/15'],
    ['pink', 'bg-pink-500/15'],
    ['mint', 'bg-emerald-500/15'],
    ['gray', 'bg-white/10'],
  ] as const)('applies %s color class', (color, expectedClass) => {
    const { container } = render(<Badge color={color}>badge</Badge>)
    expect(container.firstChild).toHaveClass(expectedClass)
  })

  it('merges custom className', () => {
    const { container } = render(<Badge className="custom-badge">badge</Badge>)
    expect(container.firstChild).toHaveClass('custom-badge')
  })
})
