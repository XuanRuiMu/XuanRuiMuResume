import { useMutation } from '@tanstack/react-query'
import type { AiMessage } from '../store/useAppStore'
import { retrieveChunks } from './ragEngine'
import { personalInfo } from '../data/personalInfo'
import { getLocalAnswer } from './localEngine'
import { extractJsonFromText, parseAssistantPayload, type AssistantPayload } from './structuredOutput'

export interface ChatOptions {
  deepseekApiKey?: string
  model?: string
  maxContextChunks?: number
}

export interface ChatServiceResult {
  message: AiMessage
}

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_DEFAULT_MODEL = 'deepseek-v4'

function buildSystemPrompt(context: string): string {
  return `你是玄锐暮的简历 AI 助手，只能根据下方提供的简历上下文回答问题。如果上下文无法回答，请引导用户通过邮箱 ${personalInfo.email} 联系。

你必须以 JSON 格式回复，格式如下：
{
  "text": "回复文本（必填）",
  "component": {
    "type": "ProjectCard" | "SkillRadar" | "Timeline" | "ContactForm"
    // ProjectCard 额外字段：projectId: "xrm" | "admin" | "aiConsole" | "slimefun"
    // SkillRadar 额外字段：category?: "it" | "creative" | "soft"
    // Timeline 额外字段：scope?: "experience" | "media" | "education"
  }
}

component 字段可选，仅在用户询问项目、技能、经历/时间线或联系方式时返回对应组件。

简历上下文：
${context}`
}

function parseDeepSeekResponse(rawContent: string): AssistantPayload {
  const extracted = extractJsonFromText(rawContent)
  return parseAssistantPayload(extracted)
}

async function callDeepSeek(messages: AiMessage[], apiKey: string, model: string): Promise<AiMessage> {
  const userQuestion = messages.findLast((message) => message.role === 'user')?.content ?? ''
  const contextChunks = retrieveChunks(userQuestion, 5)
  const context = contextChunks.map((chunk, index) => `[${index + 1}] ${chunk.content}`).join('\n\n')
  const systemPrompt = buildSystemPrompt(context)

  const response = await fetch(DEEPSEEK_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((message) => ({ role: message.role, content: message.content })),
      ],
      temperature: 0.6,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`LLM 请求失败：${response.status} ${text}`)
  }

  const data = await response.json()
  const rawContent = data.choices?.[0]?.message?.content

  if (typeof rawContent !== 'string') {
    throw new Error('LLM 返回格式异常')
  }

  const payload = parseDeepSeekResponse(rawContent)
  return { role: 'assistant', content: payload.text, component: payload.component }
}

export async function sendChatMessage(messages: AiMessage[], options: ChatOptions = {}): Promise<ChatServiceResult> {
  const apiKey = options.deepseekApiKey

  if (!apiKey) {
    const userQuestion = messages.findLast((message) => message.role === 'user')?.content ?? ''
    return { message: getLocalAnswer(userQuestion) }
  }

  const answer = await callDeepSeek(messages, apiKey, options.model ?? DEEPSEEK_DEFAULT_MODEL)
  return { message: answer }
}

export function useChatService(options: ChatOptions = {}) {
  const deepseekApiKey =
    options.deepseekApiKey ??
    (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_DEEPSEEK_API_KEY : undefined)

  return useMutation({
    mutationFn: async (messages: AiMessage[]) => {
      return sendChatMessage(messages, { ...options, deepseekApiKey })
    },
  })
}
