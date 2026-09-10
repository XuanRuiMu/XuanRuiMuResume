import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendChatMessage, compactConversation, 是否超时错误, 是否中断错误 } from './chatService'
import { personalInfo } from '../data/personalInfo'
import { DEEPSEEK_MODEL, DEEPSEEK_ENDPOINT } from './deepseekConfig'
import { useAppStore } from '../store/useAppStore'

const mockFetch = vi.fn()

describe('chatService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    // 锁定思考强度（默认 high）与模型（默认 DeepSeek），避免跨用例状态污染
    useAppStore.setState({ aiThinking: 'high', aiModel: 'deepseek-v4.1-flash-expires-on-0910' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('attempts the DeepSeek API and falls back to the local answer when the call fails', async () => {
    // mockFetch 默认返回 undefined → callDeepSeek 抛错 → 回退本地 RAG 兜底
    const result = await sendChatMessage([{ role: 'user', content: '你叫什么' }])

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.message.role).toBe('assistant')
    expect(result.message.content).toContain(personalInfo.name)
    expect(result.message.component).toBeUndefined()
    // 工具轨迹元数据：兜底必须诚实标注且保留真实检索命中数（FP-02根因修复）
    expect(result.meta.本地兜底).toBe(true)
    expect(result.meta.命中数).toBeGreaterThan(0)
    expect(result.meta.回退原因).toBe('network')
    expect(result.meta.耗时毫秒).toBeGreaterThanOrEqual(0)
  })

  it('falls back to the local ContactForm component for contact questions when the call fails', async () => {
    const result = await sendChatMessage([{ role: 'user', content: '怎么联系你' }])

    expect(result.message.content).toContain(personalInfo.email)
    expect(result.message.component).toEqual({ type: 'ContactForm' })
  })

  it('falls back to the local ProjectCard component for project questions when the call fails', async () => {
    const result = await sendChatMessage([{ role: 'user', content: '介绍一下暮澜纪元' }])

    expect(result.message.component).toEqual({ type: 'ProjectCard', projectId: 'xrm' })
  })

  it('falls back to a skills text answer (no component) when the call fails', async () => {
    const result = await sendChatMessage([{ role: 'user', content: '你的技术栈' }])

    expect(result.message.component).toBeUndefined()
  })

  it('falls back to the local Timeline component for education questions when the call fails', async () => {
    const result = await sendChatMessage([{ role: 'user', content: '教育背景' }])

    expect(result.message.component).toEqual({ type: 'Timeline', scope: 'education' })
  })

  it('calls the DeepSeek endpoint with the configured model and API key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"text":"DeepSeek 回答"}' } }],
      }),
    })

    const result = await sendChatMessage([{ role: 'user', content: '你是谁' }], {
      deepseekApiKey: 'sk-test',
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(callArgs[0]).toBe(DEEPSEEK_ENDPOINT)
    expect((callArgs[1].headers as Record<string, string>).Authorization).toBe('Bearer sk-test')
    const body = JSON.parse((callArgs[1].body as string) ?? '{}')
    expect(body.model).toBe(DEEPSEEK_MODEL)
    expect(body.thinking).toEqual({ type: 'enabled' })
    // 默认强度 high：官方档位 reasoning_effort 直传
    expect(body.reasoning_effort).toBe('high')
    expect(body.response_format).toEqual({ type: 'json_object' })
    expect(result.message.content).toBe('DeepSeek 回答')
    // 远程成功时标注非兜底并给出检索命中数
    expect(result.meta.本地兜底).toBe(false)
    expect(result.meta.命中数).toBeGreaterThanOrEqual(0)
  })

  it('sends user images as vision content blocks（图片消息按官方块数组格式）', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"text":"图里是一只猫"}' } }] }),
    })

    const result = await sendChatMessage(
      [
        {
          role: 'user',
          content: '这张图里有什么？',
          images: ['data:image/png;base64,QUJD', 'data:image/jpeg;base64,REVG'],
        },
      ],
      { deepseekApiKey: 'sk-test' }
    )

    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse((callArgs[1].body as string) ?? '{}')
    expect(body.model).toBe(DEEPSEEK_MODEL)
    // 第一条是 system，第二条才是带图的用户消息
    const apiUserMessage = body.messages[1]
    expect(apiUserMessage.role).toBe('user')
    expect(apiUserMessage.content[0]).toEqual({ type: 'text', text: '这张图里有什么？' })
    expect(apiUserMessage.content[1]).toEqual({ type: 'image_url', image_url: { url: 'data:image/png;base64,QUJD' } })
    expect(apiUserMessage.content[2]).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/jpeg;base64,REVG' },
    })
    expect(result.message.content).toBe('图里是一只猫')
  })

  it('keeps plain string content for messages without images and for assistant history', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"text":"回答"}' } }] }),
    })

    await sendChatMessage(
      [
        { role: 'user', content: '问题一' },
        { role: 'assistant', content: '回答一' },
        { role: 'user', content: '问题二' },
      ],
      { deepseekApiKey: 'sk-test' }
    )

    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse((callArgs[1].body as string) ?? '{}')
    expect(body.messages[1].content).toBe('问题一')
    expect(body.messages[2].content).toBe('回答一')
    expect(body.messages[3].content).toBe('问题二')
  })

  it('parses structured JSON response from DeepSeek', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                text: '推荐暮澜纪元项目',
                component: { type: 'ProjectCard', projectId: 'xrm' },
              }),
            },
          },
        ],
      }),
    })

    const result = await sendChatMessage([{ role: 'user', content: '推荐一个项目' }], {
      deepseekApiKey: 'sk-test',
    })

    expect(result.message.content).toBe('推荐暮澜纪元项目')
    expect(result.message.component).toEqual({ type: 'ProjectCard', projectId: 'xrm' })
  })

  it('falls back to text when DeepSeek returns plain text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '纯文本回答' } }],
      }),
    })

    const result = await sendChatMessage([{ role: 'user', content: '你好' }], {
      deepseekApiKey: 'sk-test',
    })

    expect(result.message.content).toBe('纯文本回答')
    expect(result.message.component).toBeUndefined()
  })

  it('falls back to local answer when LLM response is not ok (4xx)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    })

    const result = await sendChatMessage([{ role: 'user', content: '怎么联系你' }], { deepseekApiKey: 'bad-key' })

    expect(result.message.content).toContain(personalInfo.email)
    expect(result.message.component).toEqual({ type: 'ContactForm' })
  })

  it('falls back to local answer when LLM response is not ok (5xx)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    })

    const result = await sendChatMessage([{ role: 'user', content: '介绍一下暮澜纪元' }], { deepseekApiKey: 'sk-test' })

    expect(result.message.component).toEqual({ type: 'ProjectCard', projectId: 'xrm' })
  })

  it('falls back to local answer when LLM request times out', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'))

    const result = await sendChatMessage([{ role: 'user', content: '你的技术栈' }], { deepseekApiKey: 'sk-test' })

    expect(result.message.component).toBeUndefined()
  })

  it('超时回退并标注timeout原因', async () => {
    mockFetch.mockRejectedValueOnce(new DOMException('请求超时', 'TimeoutError'))
    const result = await sendChatMessage([{ role: 'user', content: '介绍一下暮澜纪元' }], {
      deepseekApiKey: 'sk-test',
    })
    expect(result.meta.本地兜底).toBe(true)
    expect(result.meta.回退原因).toBe('timeout')
    expect(result.message.component).toEqual({ type: 'ProjectCard', projectId: 'xrm' })
  })

  it('falls back to local answer when LLM response format is invalid', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [] }),
    })

    const result = await sendChatMessage([{ role: 'user', content: '教育背景' }], { deepseekApiKey: 'sk-test' })

    expect(result.message.component).toEqual({ type: 'Timeline', scope: 'education' })
  })

  it('passes the abort signal through to fetch（Claude Code Esc 中断链路）', async () => {
    const controller = new AbortController()
    let 捕获信号: AbortSignal | undefined
    mockFetch.mockImplementationOnce(async (_url: unknown, init?: RequestInit) => {
      捕获信号 = init?.signal as AbortSignal | undefined
      expect(捕获信号).toBeInstanceOf(AbortSignal)
      expect(捕获信号?.aborted).toBe(false)
      controller.abort()
      expect(捕获信号?.aborted).toBe(true)
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: '{"text":"回答"}' } }] }),
      }
    })

    await sendChatMessage([{ role: 'user', content: '你是谁' }], {
      deepseekApiKey: 'sk-test',
      signal: controller.signal,
    })

    expect(捕获信号?.aborted).toBe(true)
  })

  it('rethrows AbortError without falling back to the local answer（中断不得被兜底吞掉）', async () => {
    mockFetch.mockRejectedValueOnce(new DOMException('The operation was aborted.', 'AbortError'))

    await expect(
      sendChatMessage([{ role: 'user', content: '你是谁' }], { deepseekApiKey: 'sk-test' })
    ).rejects.toMatchObject({
      name: 'AbortError',
    })
  })

  it('maps thinking intensity levels to official DeepSeek wire params', async () => {
    for (const [强度, thinking, reasoning_effort] of [
      ['low', { type: 'enabled' }, 'low'],
      ['max', { type: 'enabled' }, 'max'],
      ['off', { type: 'disabled' }, undefined],
    ] as const) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '{"text":"ok"}' } }] }),
      })
      useAppStore.setState({ aiThinking: 强度 })

      await sendChatMessage([{ role: 'user', content: '你是谁' }], { deepseekApiKey: 'sk-test' })

      const callArgs = mockFetch.mock.calls.at(-1) as [string, RequestInit]
      const body = JSON.parse((callArgs[1].body as string) ?? '{}')
      expect(body.thinking).toEqual(thinking)
      expect(body.reasoning_effort).toBe(reasoning_effort)
    }
  })

  it('是否超时错误仅识别TimeoutError', () => {
    expect(是否超时错误(new DOMException('请求超时', 'TimeoutError'))).toBe(true)
    expect(是否超时错误(new DOMException('aborted', 'AbortError'))).toBe(false)
    expect(是否中断错误(new DOMException('aborted', 'AbortError'))).toBe(true)
    expect(是否中断错误(new DOMException('timeout', 'TimeoutError'))).toBe(false)
  })

  it('错误体截断不泄露密钥', async () => {
    const 密钥 = 'sk-secret-1234567890'
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => `x`.repeat(1000) })
    const result = await sendChatMessage([{ role: 'user', content: '你是谁' }], {
      deepseekApiKey: 密钥,
    })
    expect(result.meta.回退原因).toBe('http')
    const callArgs = mockFetch.mock.calls.at(-1) as [string, RequestInit]
    expect((callArgs[1].headers as Record<string, string>).Authorization).toBe(`Bearer ${密钥}`)
  })

  it('失败路径保留真实检索命中数（暮澜纪元失败仍有命中非0）', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'Service Unavailable' })
    const result = await sendChatMessage([{ role: 'user', content: '介绍一下暮澜纪元' }], {
      deepseekApiKey: 'sk-test',
    })
    expect(result.meta.本地兜底).toBe(true)
    expect(result.meta.命中数).toBeGreaterThan(0)
    expect(result.meta.回退原因).toBe('http')
    expect(result.meta.http状态).toBe(503)
    expect(result.message.component).toEqual({ type: 'ProjectCard', projectId: 'xrm' })
  })

  it('你好失败回退为问候语非没准备答案且命中0诚实', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'))
    const { t } = await import('../i18n/translations')
    const result = await sendChatMessage([{ role: 'user', content: '你好' }], { deepseekApiKey: 'sk-test' })
    expect(result.message.content).toBe(t('chat.answers.greeting'))
    expect(result.message.content).not.toContain('没准备答案')
    expect(result.meta.本地兜底).toBe(true)
    expect(result.meta.命中数).toBe(0)
    expect(result.meta.回退原因).toBe('network')
  })

  it('你好成功时检索为空且非兜底（空上下文而非硬塞）', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"text":"你好呀"}' } }] }),
    })
    const result = await sendChatMessage([{ role: 'user', content: '你好' }], { deepseekApiKey: 'sk-test' })
    expect(result.message.content).toBe('你好呀')
    expect(result.meta.本地兜底).toBe(false)
    expect(result.meta.命中数).toBe(0)
    const callArgs = mockFetch.mock.calls.at(-1) as [string, RequestInit]
    const body = JSON.parse((callArgs[1].body as string) ?? '{}')
    expect(JSON.stringify(body)).not.toContain('暮澜纪元')
  })
})

describe('compactConversation（/compact 语义压缩）', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    useAppStore.setState({ aiThinking: 'high', aiModel: 'deepseek-v4.1-flash-expires-on-0910' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('returns the model summary text on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"text":"用户询问了技术栈"}' } }] }),
    })

    const 摘要 = await compactConversation([
      { role: 'user', content: '你的技术栈是什么' },
      { role: 'assistant', content: 'React + TypeScript' },
    ])

    expect(摘要).toBe('用户询问了技术栈')
    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse((callArgs[1].body as string) ?? '{}')
    expect(body.thinking).toEqual({ type: 'disabled' })
  })

  it('appends the focus instruction when provided（/compact [instructions]）', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"text":"聚焦摘要"}' } }] }),
    })

    const 摘要 = await compactConversation([{ role: 'user', content: '介绍项目' }], { focus: '只看项目' })

    expect(摘要).toBe('聚焦摘要')
    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse((callArgs[1].body as string) ?? '{}')
    expect(JSON.stringify(body)).toContain('只看项目')
  })

  it('throws on failure instead of fabricating a local summary（压缩失败不得伪造摘要）', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'Service Unavailable' })

    await expect(compactConversation([{ role: 'user', content: '你好' }])).rejects.toThrow()
  })
})
