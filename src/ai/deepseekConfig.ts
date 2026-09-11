/**
 * DeepSeek 配置。
 * 密钥通过 Vite 环境变量 VITE_DEEPSEEK_API_KEY 注入（本地放 .env.local，已被 .gitignore 忽略），
 * 严禁在源码中硬编码——既符合凭据安全规范，也避免被 GitHub 推送保护拦截。
 *
 * 端点：开发环境走 Vite 代理 /api/deepseek（绕过浏览器 CORS）；
 * 生产构建直连官方端点（静态托管即可工作，部署时需在托管平台配置同名环境变量）。
 */
export const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY ?? ''

/** 唯一模型：vision 实验版，支持文本+图片输入（官方文档：JPEG/PNG/GIF/WebP，仅 user 消息可带图）。 */
export const DEEPSEEK_MODEL = 'deepseek-v4.1-flash-expires-on-0910'

/** v4 上下文上限（token），状态栏「上下文默认最大」指示用。 */
export const DEEPSEEK_CONTEXT_MAX = 1_000_000

/** v4 系列默认启用 thinking，max_tokens 需 ≥500，此处开满以承载长思考。 */
export const DEEPSEEK_MAX_TOKENS = 8192

/** RAG 检索召回数：开满上下文，让模型基于工作区知识作答。 */
export const DEEPSEEK_RETRIEVE_TOP_K = 8

function 读取浮点环境变量(原始值: string | undefined, 默认值: number): number {
  if (原始值 === undefined || 原始值 === '') return 默认值
  const 解析值 = Number(原始值)
  if (!Number.isFinite(解析值) || 解析值 < 0) return 默认值
  return 解析值
}

/** RAG 检索最低分：低于此分数的片段视为无效（问候/寒暄天然低分），直接过滤不硬塞上下文。可经 VITE_RAG_MIN_SCORE 配置。 */
export const RAG检索最低分 = 读取浮点环境变量(import.meta.env.VITE_RAG_MIN_SCORE, 0.3)

export const DEEPSEEK_ENDPOINT = import.meta.env.DEV
  ? '/api/deepseek'
  : 'https://api.deepseek.com/v1/chat/completions'
