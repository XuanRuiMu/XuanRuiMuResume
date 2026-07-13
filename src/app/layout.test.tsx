import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Layout } from './layout'

vi.mock('../components/nav-dock/NavDock', () => ({
  NavDock: () => <nav data-testid="nav-dock" />,
}))

vi.mock('../components/theme-toggle/ThemeToggle', () => ({
  ThemeToggle: () => <button type="button" data-testid="theme-toggle" />,
}))

vi.mock('../components/command-palette/CommandPalette', () => ({
  CommandPalette: () => <div data-testid="command-palette" />,
}))

vi.mock('../components/ai-chat/AIChat', () => ({
  AIChat: () => <div data-testid="ai-chat" />,
}))

vi.mock('../components/PWAStatusIndicator', () => ({
  PWAStatusIndicator: () => <div data-testid="pwa-status" />,
}))

vi.mock('../components/starry-background/StarryBackground', () => ({
  StarryBackground: ({ className }: { className?: string }) => (
    <div data-testid="starry-background" className={className} />
  ),
}))

describe('Layout', () => {
  it('renders children and global starfield background', () => {
    render(
      <Layout>
        <section data-testid="page-content">content</section>
      </Layout>
    )

    expect(screen.getByTestId('page-content')).toBeInTheDocument()
    expect(screen.getByTestId('starry-background')).toBeInTheDocument()
  })

  it('renders navigation, theme toggle and overlays', () => {
    render(
      <Layout>
        <div>page</div>
      </Layout>
    )

    expect(screen.getByTestId('nav-dock')).toBeInTheDocument()
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    expect(screen.getByTestId('command-palette')).toBeInTheDocument()
    expect(screen.getByTestId('ai-chat')).toBeInTheDocument()
    expect(screen.getByTestId('pwa-status')).toBeInTheDocument()
  })
})
