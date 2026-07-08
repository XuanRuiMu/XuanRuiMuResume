import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'

describe('Tabs', () => {
  it('renders triggers with roles', () => {
    render(
      <Tabs value="a" onValueChange={vi.fn()}>
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
      </Tabs>
    )
    expect(screen.getByRole('tab', { name: /A/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /B/i })).toBeInTheDocument()
  })

  it('marks active trigger with aria-selected', () => {
    render(
      <Tabs value="a" onValueChange={vi.fn()}>
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
      </Tabs>
    )
    expect(screen.getByRole('tab', { name: /A/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /B/i })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onValueChange when trigger clicked', () => {
    const handleChange = vi.fn()
    render(
      <Tabs value="a" onValueChange={handleChange}>
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
      </Tabs>
    )
    fireEvent.click(screen.getByRole('tab', { name: /B/i }))
    expect(handleChange).toHaveBeenCalledWith('b')
  })

  it('shows content for active tab only', () => {
    render(
      <Tabs value="a" onValueChange={vi.fn()}>
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">content a</TabsContent>
        <TabsContent value="b">content b</TabsContent>
      </Tabs>
    )
    expect(screen.getByText('content a')).toBeInTheDocument()
    expect(screen.queryByText('content b')).not.toBeInTheDocument()
  })

  it('throws when compound components are used outside Tabs', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TabsTrigger value="a">A</TabsTrigger>)).toThrow()
    consoleError.mockRestore()
  })
})
