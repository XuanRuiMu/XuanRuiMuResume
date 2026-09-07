import { DEEPSEEK_API_KEY, DEEPSEEK_ENDPOINT } from './deepseekConfig'

export type 模型供应商 = 'openai' | 'anthropic'

export interface 模型定义 {
  id: string
  provider: 模型供应商
  contextLabel?: string
  endpoint: string
  apiKey: string
}

export const 默认模型ID = 'deepseek-v4-flash-vision-exp'

export const GLM默认BASE = 'https://open.bigmodel.cn/api/anthropic'

export const GLM默认模型 = 'glm-4.7-flash'

const AI模型存储键 = 'xuan-ai-model'

export function 读取已选模型ID(): string {
  try {
    return localStorage.getItem(AI模型存储键) ?? 默认模型ID
  } catch {
    return 默认模型ID
  }
}

export function 持久化已选模型ID(id: string): void {
  try {
    localStorage.setItem(AI模型存储键, id)
  } catch {
    // 无痕/沙箱下持久化不可用时静默降级为内存态
  }
}

function GLM基础地址(): string {
  return (import.meta.env.VITE_GLM_BASE_URL ?? GLM默认BASE).replace(/\/+$/, '')
}

export function GLM模型ID(): string {
  return import.meta.env.VITE_GLM_MODEL ?? GLM默认模型
}

export function 模型列表(): 模型定义[] {
  const glmBase = GLM基础地址()
  const glmId = GLM模型ID()
  return [
    {
      id: 默认模型ID,
      provider: 'openai',
      contextLabel: 'CTX 1M',
      endpoint: DEEPSEEK_ENDPOINT,
      apiKey: DEEPSEEK_API_KEY,
    },
    {
      id: glmId,
      provider: 'anthropic',
      endpoint: import.meta.env.DEV ? '/api/glm' : `${glmBase}/v1/messages`,
      apiKey: import.meta.env.VITE_GLM_API_KEY ?? '',
    },
  ]
}

export function 解析模型(id?: string): 模型定义 {
  const 列表 = 模型列表()
  return 列表.find((模型) => 模型.id === id) ?? 列表[0]
}
