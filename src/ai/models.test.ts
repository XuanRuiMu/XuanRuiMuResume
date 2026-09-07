import { describe, it, expect } from 'vitest'
import { 模型列表, 解析模型, 默认模型ID, GLM默认模型 } from './models'

describe('模型注册表', () => {
  it('包含 DeepSeek 默认模型与 GLM 可切换模型', () => {
    const 标识 = 模型列表().map((模型) => 模型.id)
    expect(标识).toContain(默认模型ID)
    expect(标识).toContain(GLM默认模型)
  })

  it('GLM 走 Anthropic 协议且默认指向 BigModel 兼容端点', () => {
    const glm = 解析模型(GLM默认模型)
    expect(glm.provider).toBe('anthropic')
    expect(glm.endpoint).toContain('/api/glm')
  })

  it('未知模型回退到默认模型', () => {
    expect(解析模型('not-exist-model').id).toBe(默认模型ID)
  })
})
