import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AdvancedTabs, AdvancedTabsList, AdvancedTabsTrigger, AdvancedTabsContent } from './Tabs'

describe('AdvancedTabs', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('renders triggers with roles and tabpanel', () => {
    render(
      <AdvancedTabs value="a" onValueChange={vi.fn()}>
        <AdvancedTabsList>
          <AdvancedTabsTrigger value="a">A</AdvancedTabsTrigger>
          <AdvancedTabsTrigger value="b">B</AdvancedTabsTrigger>
        </AdvancedTabsList>
        <AdvancedTabsContent value="a">content a</AdvancedTabsContent>
        <AdvancedTabsContent value="b">content b</AdvancedTabsContent>
      </AdvancedTabs>
    )

    expect(screen.getByRole('tab', { name: /A/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /B/i })).toBeInTheDocument()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('content a')
  })

  it('marks active trigger with aria-selected and roving tabindex', () => {
    render(
      <AdvancedTabs value="a" onValueChange={vi.fn()}>
        <AdvancedTabsList>
          <AdvancedTabsTrigger value="a">A</AdvancedTabsTrigger>
          <AdvancedTabsTrigger value="b">B</AdvancedTabsTrigger>
        </AdvancedTabsList>
      </AdvancedTabs>
    )

    const a = screen.getByRole('tab', { name: /A/i })
    const b = screen.getByRole('tab', { name: /B/i })
    expect(a).toHaveAttribute('aria-selected', 'true')
    expect(a).toHaveAttribute('tabIndex', '0')
    expect(b).toHaveAttribute('aria-selected', 'false')
    expect(b).toHaveAttribute('tabIndex', '-1')
  })

  it('calls onValueChange when trigger clicked', () => {
    const handleChange = vi.fn()
    render(
      <AdvancedTabs value="a" onValueChange={handleChange}>
        <AdvancedTabsList>
          <AdvancedTabsTrigger value="a">A</AdvancedTabsTrigger>
          <AdvancedTabsTrigger value="b">B</AdvancedTabsTrigger>
        </AdvancedTabsList>
      </AdvancedTabs>
    )

    fireEvent.click(screen.getByRole('tab', { name: /B/i }))
    expect(handleChange).toHaveBeenCalledWith('b')
  })

  it('shows content for active tab only', () => {
    render(
      <AdvancedTabs value="a" onValueChange={vi.fn()}>
        <AdvancedTabsList>
          <AdvancedTabsTrigger value="a">A</AdvancedTabsTrigger>
          <AdvancedTabsTrigger value="b">B</AdvancedTabsTrigger>
        </AdvancedTabsList>
        <AdvancedTabsContent value="a">content a</AdvancedTabsContent>
        <AdvancedTabsContent value="b">content b</AdvancedTabsContent>
      </AdvancedTabs>
    )

    expect(screen.getByText('content a')).toBeInTheDocument()
    expect(screen.queryByText('content b')).not.toBeInTheDocument()
  })

  it('links tabpanel to trigger via aria-labelledby', () => {
    render(
      <AdvancedTabs value="a" onValueChange={vi.fn()}>
        <AdvancedTabsList>
          <AdvancedTabsTrigger value="a">A</AdvancedTabsTrigger>
        </AdvancedTabsList>
        <AdvancedTabsContent value="a">content a</AdvancedTabsContent>
      </AdvancedTabs>
    )

    const trigger = screen.getByRole('tab', { name: /A/i })
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', trigger.id)
    expect(trigger).toHaveAttribute('aria-controls', panel.id)
  })

  it('navigates tabs with arrow keys and moves focus', () => {
    const handleChange = vi.fn()
    render(
      <AdvancedTabs value="a" onValueChange={handleChange}>
        <AdvancedTabsList>
          <AdvancedTabsTrigger value="a">A</AdvancedTabsTrigger>
          <AdvancedTabsTrigger value="b">B</AdvancedTabsTrigger>
          <AdvancedTabsTrigger value="c">C</AdvancedTabsTrigger>
        </AdvancedTabsList>
      </AdvancedTabs>
    )

    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'ArrowRight' })
    expect(handleChange).toHaveBeenCalledWith('b')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: /B/i }))
  })

  it('wraps to last tab with ArrowLeft from first tab', () => {
    const handleChange = vi.fn()
    render(
      <AdvancedTabs value="a" onValueChange={handleChange}>
        <AdvancedTabsList>
          <AdvancedTabsTrigger value="a">A</AdvancedTabsTrigger>
          <AdvancedTabsTrigger value="b">B</AdvancedTabsTrigger>
        </AdvancedTabsList>
      </AdvancedTabs>
    )

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' })
    expect(handleChange).toHaveBeenCalledWith('b')
  })

  it('jumps to first and last tab with Home and End', () => {
    const handleChange = vi.fn()
    render(
      <AdvancedTabs value="b" onValueChange={handleChange}>
        <AdvancedTabsList>
          <AdvancedTabsTrigger value="a">A</AdvancedTabsTrigger>
          <AdvancedTabsTrigger value="b">B</AdvancedTabsTrigger>
          <AdvancedTabsTrigger value="c">C</AdvancedTabsTrigger>
        </AdvancedTabsList>
      </AdvancedTabs>
    )

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'Home' })
    expect(handleChange).toHaveBeenCalledWith('a')

    handleChange.mockClear()
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'End' })
    expect(handleChange).toHaveBeenCalledWith('c')
  })

  it('throws when compound components are used outside AdvancedTabs', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<AdvancedTabsTrigger value="a">A</AdvancedTabsTrigger>)).toThrow()
    consoleError.mockRestore()
  })
})
