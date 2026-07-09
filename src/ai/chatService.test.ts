import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendChatMessage } from './chatService'
import { personalInfo } from '../data/personalInfo'

const mockFetch = vi.fn()

describe('chatService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('returns local structured answer when no API key is configured', async () => {
    const result = await sendChatMessage([{ role: 'user', content: '你叫什么' }])

    expect(result.message.role).toBe('assistant')
    expect(result.message.content).toContain(personalInfo.name)
    expect(result.message.component).toBeUndefined()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns ContactForm component for contact questions locally', async () => {
    const result = await sendChatMessage([{ role: 'user', content: '怎么联系你' }])

    expect(result.message.content).toContain(personalInfo.email)
    expect(result.message.component).toEqual({ type: 'ContactForm' })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns ProjectCard component for project questions locally', async () => {
    const result = await sendChatMessage([{ role: 'user', content: '介绍一下暮澜纪元' }])

    expect(result.message.component).toEqual({ type: 'ProjectCard', projectId: 'xrm' })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns SkillRadar component for skill questions locally', async () => {
    const result = await sendChatMessage([{ role: 'user', content: '你的技术栈' }])

    expect(result.message.component).toEqual({ type: 'SkillRadar' })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns Timeline component for education questions locally', async () => {
    const result = await sendChatMessage([{ role: 'user', content: '教育背景' }])

    expect(result.message.component).toEqual({ type: 'Timeline', scope: 'education' })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls DeepSeek API when API key is provided', async () => {
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
    expect(callArgs[0]).toBe('https://api.deepseek.com/v1/chat/completions')
    expect((callArgs[1].headers as Record<string, string>).Authorization).toBe('Bearer sk-test')
    const body = JSON.parse((callArgs[1].body as string) ?? '{}')
    expect(body.model).toBe('deepseek-v4')
    expect(body.response_format).toEqual({ type: 'json_object' })
    expect(result.message.content).toBe('DeepSeek 回答')
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

    expect(result.message.component).toEqual({ type: 'SkillRadar' })
  })

  it('falls back to local answer when LLM response format is invalid', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [] }),
    })

    const result = await sendChatMessage([{ role: 'user', content: '教育背景' }], { deepseekApiKey: 'sk-test' })

    expect(result.message.component).toEqual({ type: 'Timeline', scope: 'education' })
  })
})
