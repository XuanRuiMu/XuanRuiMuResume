import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from './Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>card content</Card>)
    expect(screen.getByText('card content')).toBeInTheDocument()
  })

  it('renders header', () => {
    render(<Card header={<span data-testid="header">header</span>}>content</Card>)
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('renders footer', () => {
    render(<Card footer={<span data-testid="footer">footer</span>}>content</Card>)
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('applies glass panel class', () => {
    const { container } = render(<Card glass>content</Card>)
    expect(container.firstChild).toHaveClass('glass-panel')
  })

  it('applies hover lift class', () => {
    const { container } = render(<Card hover>content</Card>)
    expect(container.firstChild).toHaveClass('hover:-translate-y-1')
  })

  it('merges custom className', () => {
    const { container } = render(<Card className="custom-card">content</Card>)
    expect(container.firstChild).toHaveClass('custom-card')
  })

  it('applies tilt classes', () => {
    const { container } = render(<Card tilt>content</Card>)
    expect(container.firstChild).toHaveClass('tilt-card')
    expect(container.firstChild).toHaveClass('will-change-transform')
  })
})
