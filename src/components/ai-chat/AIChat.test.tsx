import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { AIChat } from './AIChat'
import { useAppStore } from '../../store/useAppStore'
import { t, ta } from '../../i18n/translations'

const addAiMessage = vi.fn()
const clearAiMessages = vi.fn()
const setChatOpen = vi.fn()
const mutateAsync = vi.fn()
const mutationReset = vi.fn()

vi.mock('../../store/useAppStore', () => ({
  useAppStore: vi.fn(),
}))

vi.mock('../../ai/chatService', () => ({
  useChatService: () => ({
    mutateAsync,
    isPending: false,
    reset: mutationReset,
    error: null,
  }),
}))

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>

describe('AIChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn()
    }
    mockUseAppStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chatOpen: false,
        setChatOpen,
        aiMessages: [],
        addAiMessage,
        clearAiMessages,
      })
    )
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders floating button when closed', () => {
    render(<AIChat />)
    expect(screen.getByRole('button', { name: t('ai.title') })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens chat dialog when floating button clicked', () => {
    render(<AIChat />)
    fireEvent.click(screen.getByRole('button', { name: t('ai.title') }))
    expect(setChatOpen).toHaveBeenCalledWith(true)
  })

  it('renders chat dialog with quick questions when open', () => {
    mockUseAppStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chatOpen: true,
        setChatOpen,
        aiMessages: [],
        addAiMessage,
        clearAiMessages,
      })
    )

    render(<AIChat />)
    expect(screen.getByRole('dialog', { name: t('ai.title') })).toBeInTheDocument()
    expect(screen.getByText(t('ai.empty'))).toBeInTheDocument()

    const quickQuestions = ta('ai.quickQuestions')
    for (const question of quickQuestions) {
      expect(screen.getByText(question)).toBeInTheDocument()
    }
  })

  it('sends message when form submitted', async () => {
    mutateAsync.mockResolvedValueOnce({ message: { role: 'assistant', content: '回答' } })

    mockUseAppStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chatOpen: true,
        setChatOpen,
        aiMessages: [],
        addAiMessage,
        clearAiMessages,
      })
    )

    render(<AIChat />)
    const input = screen.getByPlaceholderText(t('ai.placeholder'))
    fireEvent.change(input, { target: { value: '你是谁' } })
    fireEvent.submit(input.closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(addAiMessage).toHaveBeenCalledWith({ role: 'user', content: '你是谁' })
      expect(mutateAsync).toHaveBeenCalledWith([{ role: 'user', content: '你是谁' }])
    })
  })

  it('renders existing messages and assistant answer', () => {
    mockUseAppStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chatOpen: true,
        setChatOpen,
        aiMessages: [
          { role: 'user', content: '问题' },
          { role: 'assistant', content: '答案' },
        ],
        addAiMessage,
        clearAiMessages,
      })
    )

    render(<AIChat />)
    expect(screen.getByText('问题')).toBeInTheDocument()
    expect(screen.getByText('答案')).toBeInTheDocument()
  })

  it('clears messages when reset button clicked', () => {
    mockUseAppStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chatOpen: true,
        setChatOpen,
        aiMessages: [{ role: 'user', content: '问题' }],
        addAiMessage,
        clearAiMessages,
      })
    )

    render(<AIChat />)
    fireEvent.click(screen.getByRole('button', { name: t('ai.reset') }))
    expect(clearAiMessages).toHaveBeenCalled()
    expect(mutationReset).toHaveBeenCalled()
  })

  it('closes chat when close button clicked', () => {
    mockUseAppStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chatOpen: true,
        setChatOpen,
        aiMessages: [],
        addAiMessage,
        clearAiMessages,
      })
    )

    render(<AIChat />)
    fireEvent.click(screen.getByRole('button', { name: t('ai.close') }))
    expect(setChatOpen).toHaveBeenCalledWith(false)
  })
})
