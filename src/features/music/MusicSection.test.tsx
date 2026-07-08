import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MusicSection } from './MusicSection'
import { music } from '../../data/music'
import { t } from '../../i18n/translations'

describe('MusicSection', () => {
  it('renders section title and subtitle', () => {
    render(<MusicSection />)
    expect(screen.getByRole('heading', { name: t('music.title') })).toBeInTheDocument()
    expect(screen.getByText(t('music.subtitle'))).toBeInTheDocument()
  })

  it('renders headline and intro', () => {
    render(<MusicSection />)
    expect(screen.getByRole('heading', { name: t(music.headlineKey) })).toBeInTheDocument()
    expect(screen.getByText(t(music.introKey))).toBeInTheDocument()
  })

  it('renders works tab by default with all tracks', () => {
    render(<MusicSection />)
    for (const track of music.tracks) {
      expect(screen.getByRole('heading', { name: t(track.nameKey) })).toBeInTheDocument()
      expect(screen.getByText(t(track.typeKey))).toBeInTheDocument()
      expect(screen.getByText(t(track.descKey))).toBeInTheDocument()
    }
  })

  it('switches to tools tab and renders tool tags', () => {
    render(<MusicSection />)
    fireEvent.click(screen.getByRole('tab', { name: t('music.tabs.tools') }))
    for (const key of music.toolKeys) {
      expect(screen.getByText(t(key))).toBeInTheDocument()
    }
  })

  it('switches to skills tab and renders skill tags', () => {
    render(<MusicSection />)
    fireEvent.click(screen.getByRole('tab', { name: t('music.tabs.skills') }))
    for (const key of music.skillKeys) {
      expect(screen.getByText(t(key))).toBeInTheDocument()
    }
  })

  it('renders audio visualizer', () => {
    render(<MusicSection />)
    expect(screen.getByText(t('music.visualizerTitle'))).toBeInTheDocument()
  })

  it('has music id on section', () => {
    const { container } = render(<MusicSection />)
    expect(container.querySelector('section')).toHaveAttribute('id', 'music')
  })
})
