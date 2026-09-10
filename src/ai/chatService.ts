import { useMutation } from '@tanstack/react-query'
import type { AiMessage, AiToolMeta } from '../store/useAppStore'
import { retrieveChunks } from './ragEngine'
import { getLocalAnswer } from './localEngine'
import { extractJsonFromText, parseAssistantPayload, type AssistantPayload } from './structuredOutput'
import { DEEPSEEK_MAX_TOKENS, DEEPSEEK_RETRIEVE_TOP_K } from './deepseekConfig'
import { 解析模型, GLM最大令牌数, 聊天超时毫秒, type 思考强度, type 模型定义 } from './models'
import { useAppStore, type 回退原因 } from '../store/useAppStore'

export interface ChatOptions {
  deepseekApiKey?: string
  glmApiKey?: string
  model?: string
  maxContextChunks?: number
  /** /compact 可选聚焦说明 */
  focus?: string
  /** 中断信号（对齐 Claude Code 的 Esc 中断语义）；abort 时抛出 AbortError，不回退本地兜底 */
  signal?: AbortSignal
}

export interface ChatServiceResult {
  message: AiMessage
  /** 检索轨迹元数据 */
  meta: AiToolMeta
}

function 获取最后用户内容(messages: AiMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i].content
    }
  }
  return ''
}

function buildSystemPrompt(context: string): string {
  return `你是玄锐暮的简历 AI 助手。你可以自由与用户交流任何话题，但不得生成违法违规内容；涉及玄锐暮本人信息时，以下方简历上下文为准，上下文没有的信息不要编造。

你必须以 JSON 格式回复，格式如下：
{
  "text": "回复文本（必填）",
  "component": {
    "type": "ProjectCard" | "Timeline" | "ContactForm"
    // ProjectCard 额外字段：projectId: "xrm" | "lovewithme" | "aiConsole"
    // Timeline 额外字段：scope?: "experience" | "media" | "education"
  }
}

component 字段可选，仅在用户询问项目、经历/时间线或联系方式时返回对应组件。用户发来图片时，结合图片内容回答。

简历上下文：
${context}`
}

function parseDeepSeekResponse(rawContent: string): AssistantPayload {
  const extracted = extractJsonFromText(rawContent)
  return parseAssistantPayload(extracted)
}

export function 是否中断错误(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

export function 是否超时错误(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'TimeoutError'
}

function 合并中断信号(用户信号?: AbortSignal, 超时毫秒?: number): { 信号: AbortSignal | undefined; 清理: () => void } {
  if (!用户信号 && !(超时毫秒 && 超时毫秒 > 0)) {
    return { 信号: 用户信号, 清理: () => {} }
  }
  const 控制器 = new AbortController()
  const 清理项: Array<() => void> = []
  if (用户信号) {
    if (用户信号.aborted) {
      控制器.abort((用户信号 as AbortSignal & { reason?: unknown }).reason)
    } else {
      const 转发中断 = () => 控制器.abort((用户信号 as AbortSignal & { reason?: unknown }).reason)
      用户信号.addEventListener('abort', 转发中断, { once: true })
      清理项.push(() => 用户信号.removeEventListener('abort', 转发中断))
    }
  }
  if (超时毫秒 && 超时毫秒 > 0) {
    const 计时器 = setTimeout(() => {
      控制器.abort(new DOMException('请求超时', 'TimeoutError'))
    }, 超时毫秒)
    清理项.push(() => clearTimeout(计时器))
  }
  return {
    信号: 控制器.signal,
    清理: () => {
      for (const 清理单项 of 清理项) 清理单项()
    },
  }
}

async function 带超时请求(
  地址: string,
  初始化: RequestInit,
  用户信号?: AbortSignal,
  超时毫秒?: number
): Promise<Response> {
  const { 信号, 清理 } = 合并中断信号(用户信号, 超时毫秒)
  try {
    return await fetch(地址, 信号 ? { ...初始化, signal: 信号 } : 初始化)
  } finally {
    清理()
  }
}

function 抛出响应错误(响应: Response, 正文: string): never {
  const 错误 = new Error(`LLM 请求失败：${响应.status} ${正文.slice(0, 300)}`) as Error & { http状态?: number }
  错误.http状态 = 响应.status
  throw 错误
}

function 提取Anthropic文本(数据: unknown): string | undefined {
  if (typeof 数据 !== 'object' || 数据 === null || !('content' in 数据)) return undefined
  const 内容 = (数据 as { content: unknown }).content
  if (!Array.isArray(内容)) return undefined
  const 拼接 = 内容
    .filter((块: unknown) => typeof 块 === 'object' && 块 !== null && 'text' in 块)
    .map((块: { text: unknown }) => (typeof 块.text === 'string' ? 块.text : ''))
    .join('')
  return 拼接.length > 0 ? 拼接 : undefined
}

function 分类回退原因(err: unknown): { 回退原因: 回退原因; http状态?: number } {
  if (是否超时错误(err)) return { 回退原因: 'timeout' }
  const 状态 = (err as { http状态?: unknown } | null)?.http状态
  if (typeof 状态 === 'number') return { 回退原因: 'http', http状态: 状态 }
  if (err instanceof Error && err.message.includes('返回格式异常')) return { 回退原因: 'format' }
  return { 回退原因: 'network' }
}

/**
 * 把一条 AiMessage 转为 API 消息体。
 * 带 images 的 user 消息按 vision 格式拆块数组（text 块 + image_url 块）；
 * 其余（含 assistant）保持纯字符串——API 限制图片仅允许出现在 user 消息中。
 */
function 到Api消息(message: AiMessage): Record<string, unknown> {
  const hasImages = message.role === 'user' && !!message.images && message.images.length > 0
  if (!hasImages) {
    return { role: message.role, content: message.content }
  }
  return {
    role: message.role,
    content: [
      { type: 'text', text: message.content },
      ...(message.images ?? []).map((url) => ({ type: 'image_url', image_url: { url } })),
    ],
  }
}

/**
 * DeepSeek(OpenAI 兼容)思考体：官方 thinking_mode 档位——关闭即 thinking.disabled 且不带
 * reasoning_effort；开启档 thinking.enabled + reasoning_effort 直传 low/high/max。
 */
function 思考体OpenAI(强度: 思考强度): Record<string, unknown> {
  if (强度 === 'off') return { thinking: { type: 'disabled' } }
  return { thinking: { type: 'enabled' }, reasoning_effort: 强度 }
}

/**
 * GLM(Anthropic 兼容)思考体：GLM-4.7 强制思考且不支持 reasoning_effort（5.2+ 才支持），
 * wire 上只区分 thinking.enabled/disabled。
 */
function 思考体Anthropic(强度: 思考强度): Record<string, unknown> {
  return { thinking: { type: 强度 === 'off' ? 'disabled' : 'enabled' } }
}

async function callOpenAICompletions(
  模型: 模型定义,
  apiKey: string,
  messages: AiMessage[],
  systemPrompt: string,
  思考强度档: 思考强度,
  signal?: AbortSignal
): Promise<AiMessage> {
  const body: Record<string, unknown> = {
    model: 模型.id,
    messages: [{ role: 'system', content: systemPrompt }, ...messages.map(到Api消息)],
    temperature: 0.6,
    max_tokens: DEEPSEEK_MAX_TOKENS,
    response_format: { type: 'json_object' },
    ...思考体OpenAI(思考强度档),
  }

  const response = await 带超时请求(
    模型.endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    },
    signal,
    聊天超时毫秒
  )

  if (!response.ok) {
    const text = await response.text()
    抛出响应错误(response, text)
  }

  const data = await response.json()
  const rawContent = data.choices?.[0]?.message?.content

  if (typeof rawContent !== 'string') {
    throw new Error('LLM 返回格式异常')
  }

  const payload = parseDeepSeekResponse(rawContent)
  return { role: 'assistant', content: payload.text, component: payload.component }
}

function 到Anthropic消息(message: AiMessage): Record<string, unknown> {
  const hasImages = message.role === 'user' && !!message.images && message.images.length > 0
  if (!hasImages) {
    return { role: message.role, content: message.content }
  }
  const blocks: Array<Record<string, unknown>> = [{ type: 'text', text: message.content }]
  for (const url of message.images ?? []) {
    const match = url.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/)
    if (match) {
      blocks.push({ type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } })
    }
  }
  return { role: 'user', content: blocks }
}

async function callAnthropicMessages(
  模型: 模型定义,
  apiKey: string,
  messages: AiMessage[],
  systemPrompt: string,
  思考强度档: 思考强度,
  signal?: AbortSignal
): Promise<AiMessage> {
  const response = await 带超时请求(
    模型.endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 模型.id,
        max_tokens: GLM最大令牌数,
        system: systemPrompt,
        messages: messages.map(到Anthropic消息),
        ...思考体Anthropic(思考强度档),
      }),
    },
    signal,
    聊天超时毫秒
  )

  if (!response.ok) {
    const text = await response.text()
    抛出响应错误(response, text)
  }

  const data = await response.json()
  const rawContent = 提取Anthropic文本(data)

  if (typeof rawContent !== 'string' || rawContent.length === 0) {
    throw new Error('LLM 返回格式异常')
  }

  const payload = parseDeepSeekResponse(rawContent)
  return { role: 'assistant', content: payload.text, component: payload.component }
}

function 解析本次模型与密钥(options: ChatOptions): { 模型: 模型定义; apiKey: string } {
  const storeModel = useAppStore.getState().aiModel
  const 模型 = 解析模型(options.model ?? storeModel)
  const apiKey =
    模型.provider === 'anthropic' ? (options.glmApiKey ?? 模型.apiKey) : (options.deepseekApiKey ?? 模型.apiKey)
  return { 模型, apiKey }
}

async function callChatModel(
  messages: AiMessage[],
  systemPrompt: string,
  思考强度档: 思考强度,
  options: ChatOptions
): Promise<AiMessage> {
  const { 模型, apiKey } = 解析本次模型与密钥(options)
  if (模型.provider === 'anthropic') {
    return callAnthropicMessages(模型, apiKey, messages, systemPrompt, 思考强度档, options.signal)
  }
  return callOpenAICompletions(模型, apiKey, messages, systemPrompt, 思考强度档, options.signal)
}

export async function sendChatMessage(messages: AiMessage[], options: ChatOptions = {}): Promise<ChatServiceResult> {
  const userQuestion = 获取最后用户内容(messages)
  const contextChunks = retrieveChunks(userQuestion, DEEPSEEK_RETRIEVE_TOP_K)
  const context = contextChunks.map((chunk, index) => `[${index + 1}] ${chunk.content}`).join('\n\n')
  const 开始毫秒 = Date.now()

  try {
    // 思考开关来自全局 store；上下文默认拉满：每次请求发送完整对话历史（API 无状态需自行携带）。
    const { aiThinking } = useAppStore.getState()
    const answer = await callChatModel(messages, buildSystemPrompt(context), aiThinking, options)
    return {
      message: answer,
      meta: { 命中数: contextChunks.length, 耗时毫秒: Date.now() - 开始毫秒, 本地兜底: false },
    }
  } catch (err) {
    if (是否中断错误(err)) throw err
    const 分类 = 分类回退原因(err)
    return {
      message: getLocalAnswer(userQuestion),
      meta: {
        命中数: contextChunks.length,
        耗时毫秒: Date.now() - 开始毫秒,
        本地兜底: true,
        回退原因: 分类.回退原因,
        ...(typeof 分类.http状态 === 'number' ? { http状态: 分类.http状态 } : {}),
      },
    }
  }
}

/**
 * /compact 指令（对齐 Claude Code）：调用模型把历史对话压缩为一段语义摘要。
 * 与 /clear 的区别：保留语义而非完全清空。失败原样上抛（不本地兜底，
 * 因为兜底会伪造摘要，违反压缩语义）。
 */
export async function compactConversation(messages: AiMessage[], options: ChatOptions = {}): Promise<string> {
  const 对话序列化 = messages
    .map((message) => `${message.role === 'user' ? '用户' : '助手'}：${message.content}`)
    .join('\n')
  const 压缩指令 =
    '你是对话压缩器。把用户给出的对话历史压缩为一段简明中文摘要，保留关键事实与未完成的诉求。必须以 JSON 格式回复：{"text": "摘要内容"}' +
    (options.focus ? `\n聚焦说明：${options.focus}` : '')

  const { 模型, apiKey } = 解析本次模型与密钥(options)
  let rawContent: unknown
  if (模型.provider === 'anthropic') {
    const response = await 带超时请求(
      模型.endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 模型.id,
          max_tokens: 1024,
          system: 压缩指令,
          messages: [{ role: 'user', content: 对话序列化 }],
          thinking: { type: 'disabled' },
        }),
      },
      options.signal,
      聊天超时毫秒
    )
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`压缩请求失败：${response.status} ${text.slice(0, 300)}`)
    }
    const data = await response.json()
    rawContent = 提取Anthropic文本(data)
  } else {
    const response = await 带超时请求(
      模型.endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 模型.id,
          messages: [
            { role: 'system', content: 压缩指令 },
            { role: 'user', content: 对话序列化 },
          ],
          temperature: 0.3,
          max_tokens: 1024,
          response_format: { type: 'json_object' },
          thinking: { type: 'disabled' },
        }),
      },
      options.signal,
      聊天超时毫秒
    )
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`压缩请求失败：${response.status} ${text.slice(0, 300)}`)
    }
    const data = await response.json()
    rawContent = data.choices?.[0]?.message?.content
  }
  if (typeof rawContent !== 'string') {
    throw new Error('压缩返回格式异常')
  }
  return parseDeepSeekResponse(rawContent).text
}

export function useChatService(options: ChatOptions = {}) {
  return useMutation({
    mutationFn: async ({
      messages,
      signal,
      model,
    }: {
      messages: AiMessage[]
      signal?: AbortSignal
      model?: string
    }) => {
      return sendChatMessage(messages, { ...options, ...(model ? { model } : {}), signal })
    },
  })
}
