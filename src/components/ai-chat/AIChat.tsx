import { useRef, useState, useEffect, useCallback, type FormEvent } from 'react'
import { MessageSquare, X, Send, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../lib/utils'
import { t, ta } from '../../i18n/translations'
import { useChatService } from '../../ai/chatService'
import { Button } from '../ui/Button'

interface AIChatProps {
  className?: string
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderMarkdown(content: string): string {
  const escaped = escapeHtml(content)
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/g, '<pre class="overflow-x-auto rounded-lg bg-bg p-2 text-xs"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-bg px-1 py-0.5 text-xs">$1</code>')
    .replace(/\n/g, '<br />')
}

export function AIChat({ className }: AIChatProps) {
  const chatOpen = useAppStore((state) => state.chatOpen)
  const setChatOpen = useAppStore((state) => state.setChatOpen)
  const aiMessages = useAppStore((state) => state.aiMessages)
  const addAiMessage = useAppStore((state) => state.addAiMessage)
  const clearAiMessages = useAppStore((state) => state.clearAiMessages)

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatMutation = useChatService()

  const hasApiKey = Boolean(
    typeof import.meta.env !== 'undefined' &&
    (import.meta.env.VITE_DEEPSEEK_API_KEY || import.meta.env.VITE_OPENAI_API_KEY)
  )

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (chatOpen) {
      scrollToBottom()
      inputRef.current?.focus()
    }
  }, [chatOpen, aiMessages.length, scrollToBottom])

  const handleSend = useCallback(
    async (content: string) => {
      const question = content.trim()
      if (!question || chatMutation.isPending) return

      addAiMessage({ role: 'user', content: question })
      setInput('')

      try {
        const result = await chatMutation.mutateAsync([...aiMessages, { role: 'user', content: question }])
        addAiMessage(result.message)
      } catch {
        addAiMessage({
          role: 'assistant',
          content: t('ai.error'),
        })
      }
    },
    [addAiMessage, aiMessages, chatMutation]
  )

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      handleSend(input)
    },
    [handleSend, input]
  )

  const handleQuickQuestion = useCallback(
    (question: string) => {
      handleSend(question)
    },
    [handleSend]
  )

  const handleReset = useCallback(() => {
    clearAiMessages()
    chatMutation.reset()
    setInput('')
  }, [clearAiMessages, chatMutation])

  if (!chatOpen) {
    return (
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 z-[70] flex h-12 w-12 items-center justify-center rounded-full',
          'bg-primary text-bg shadow-2xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          className
        )}
        aria-label={t('ai.title')}
      >
        <MessageSquare size={20} />
      </button>
    )
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-[70] flex h-[32rem] w-80 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl',
        'sm:w-96',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label={t('ai.title')}
    >
      <div className="flex items-center justify-between border-b border-border bg-surface-elevated px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="text-sm font-medium text-text-primary">{t('ai.title')}</span>
          {!hasApiKey && (
            <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] text-secondary">
              {t('ai.localMode')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
            aria-label={t('ai.reset')}
            title={t('ai.reset')}
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={() => setChatOpen(false)}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
            aria-label={t('ai.close')}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin">
        {aiMessages.length === 0 ? (
          <div className="flex h-full flex-col justify-center gap-4">
            <p className="text-center text-sm text-muted">{t('ai.empty')}</p>
            <div className="flex flex-wrap gap-2">
              {ta('ai.quickQuestions').map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => handleQuickQuestion(question)}
                  className="rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs text-text-primary transition-colors hover:border-primary hover:text-primary"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {aiMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                  message.role === 'user'
                    ? 'self-end bg-primary text-bg'
                    : 'self-start border border-border bg-surface-elevated text-text-primary'
                )}
                {...(message.role === 'assistant'
                  ? { dangerouslySetInnerHTML: { __html: renderMarkdown(message.content) } }
                  : { children: message.content })}
              />
            ))}
            {chatMutation.isPending && (
              <div className="self-start flex items-center gap-2 rounded-2xl border border-border bg-surface-elevated px-3 py-2 text-sm text-muted">
                <Loader2 size={14} className="animate-spin" />
                {t('ai.loading')}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border bg-surface-elevated p-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('ai.placeholder')}
            className="flex-1 rounded-full border border-border bg-bg px-4 py-2 text-sm text-text-primary outline-none placeholder:text-muted focus-visible:border-primary"
            disabled={chatMutation.isPending}
            maxLength={200}
          />
          <Button
            type="submit"
            size="sm"
            loading={chatMutation.isPending}
            disabled={!input.trim() || chatMutation.isPending}
            icon={<Send size={14} />}
            aria-label={t('ai.send')}
          />
        </div>
      </form>
    </div>
  )
}
