import { useMutation } from '@tanstack/react-query'
import type { AiMessage } from '../store/useAppStore'
import { retrieveChunks } from './ragEngine'
import { personalInfo } from '../data/personalInfo'

export interface ChatOptions {
  deepseekApiKey?: string
  openaiApiKey?: string
  model?: string
  maxContextChunks?: number
}

export interface ChatServiceResult {
  message: AiMessage
}

interface LLMProvider {
  name: string
  baseUrl: string
  apiKey: string
  model: string
}

function detectProvider(options: ChatOptions): LLMProvider | null {
  if (options.deepseekApiKey) {
    return {
      name: 'deepseek',
      baseUrl: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: options.deepseekApiKey,
      model: options.model ?? 'deepseek-v4-pro',
    }
  }

  if (options.openaiApiKey) {
    return {
      name: 'openai',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: options.openaiApiKey,
      model: options.model ?? 'gpt-4o-mini',
    }
  }

  return null
}

function buildLocalAnswer(question: string): AiMessage {
  const chunks = retrieveChunks(question, 4)
  const context = chunks.map((chunk, index) => `${index + 1}. ${chunk.content}`).join('\n')

  return {
    role: 'assistant',
    content: `根据简历信息，为你解答「${question}」：\n\n${context}\n\n如需更详细的资料，欢迎通过邮箱 ${personalInfo.email} 联系我。`,
  }
}

async function callLLM(messages: AiMessage[], provider: LLMProvider): Promise<AiMessage> {
  const userQuestion = messages.findLast((message) => message.role === 'user')?.content ?? ''
  const contextChunks = retrieveChunks(userQuestion, provider.name === 'deepseek' ? 5 : 4)
  const context = contextChunks.map((chunk, index) => `[${index + 1}] ${chunk.content}`).join('\n\n')

  const systemPrompt = `你是玄锐暮的简历 AI 助手，只能根据下方提供的简历上下文回答问题。如果上下文无法回答，请引导用户通过邮箱 ${personalInfo.email} 联系。\n\n简历上下文：\n${context}`

  const response = await fetch(provider.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((message) => ({ role: message.role, content: message.content })),
      ],
      temperature: 0.6,
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`LLM 请求失败：${response.status} ${text}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (typeof content !== 'string') {
    throw new Error('LLM 返回格式异常')
  }

  return { role: 'assistant', content }
}

export async function sendChatMessage(
  messages: AiMessage[],
  options: ChatOptions = {}
): Promise<ChatServiceResult> {
  const provider = detectProvider(options)

  if (!provider) {
    const userQuestion = messages.findLast((message) => message.role === 'user')?.content ?? ''
    return { message: buildLocalAnswer(userQuestion) }
  }

  const answer = await callLLM(messages, provider)
  return { message: answer }
}

export function useChatService(options: ChatOptions = {}) {
  const deepseekApiKey =
    options.deepseekApiKey ?? (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_DEEPSEEK_API_KEY : undefined)
  const openaiApiKey =
    options.openaiApiKey ?? (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_OPENAI_API_KEY : undefined)

  return useMutation({
    mutationFn: async (messages: AiMessage[]) => {
      return sendChatMessage(messages, { ...options, deepseekApiKey, openaiApiKey })
    },
  })
}
