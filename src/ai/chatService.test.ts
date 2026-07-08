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

  it('returns local answer when no API key is configured', async () => {
    const result = await sendChatMessage([{ role: 'user', content: '你是谁' }])

    expect(result.message.role).toBe('assistant')
    expect(result.message.content).toContain('根据简历信息')
    expect(result.message.content).toContain(personalInfo.name)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('answers contact questions locally without API key', async () => {
    const result = await sendChatMessage([{ role: 'user', content: '怎么联系你' }])

    expect(result.message.content).toContain(personalInfo.email)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('answers project questions locally without API key', async () => {
    const result = await sendChatMessage([{ role: 'user', content: '介绍一下暮澜纪元' }])

    expect(result.message.content).toContain('暮澜纪元')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls DeepSeek API when API key is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'DeepSeek 回答' } }],
      }),
    })

    const result = await sendChatMessage([{ role: 'user', content: '你是谁' }], {
      deepseekApiKey: 'sk-test',
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(callArgs[0]).toBe('https://api.deepseek.com/v1/chat/completions')
    expect((callArgs[1].headers as Record<string, string>).Authorization).toBe('Bearer sk-test')
    expect(result.message.content).toBe('DeepSeek 回答')
  })

  it('calls OpenAI API when OpenAI key is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'OpenAI 回答' } }],
      }),
    })

    const result = await sendChatMessage([{ role: 'user', content: '你的技术栈' }], {
      openaiApiKey: 'sk-openai',
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(callArgs[0]).toBe('https://api.openai.com/v1/chat/completions')
    expect((callArgs[1].headers as Record<string, string>).Authorization).toBe('Bearer sk-openai')
    expect(result.message.content).toBe('OpenAI 回答')
  })

  it('throws when LLM response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    })

    await expect(sendChatMessage([{ role: 'user', content: '你好' }], { deepseekApiKey: 'bad-key' })).rejects.toThrow(
      'LLM 请求失败'
    )
  })

  it('throws when LLM response format is invalid', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [] }),
    })

    await expect(sendChatMessage([{ role: 'user', content: '你好' }], { deepseekApiKey: 'sk-test' })).rejects.toThrow(
      'LLM 返回格式异常'
    )
  })
})
