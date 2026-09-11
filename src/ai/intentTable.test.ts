import { describe, it, expect } from 'vitest'
import { 共享意图表, 是否纯问候, 是否感谢, 是否告别, 检测项目卡片 } from './intentTable'

describe('intentTable（RAG与本地共享意图表）', () => {
  it('无重复暮澜规则（暮澜纪元只出现一次）', () => {
    const 命中数 = 共享意图表.filter((项) => 项.关键词.includes('暮澜纪元')).length
    expect(命中数).toBe(1)
  })

  it('纯问候识别（你好/您好/hi/hello）且不误伤混合问句', () => {
    for (const q of ['你好', '您好', 'hi', 'hello']) expect(是否纯问候(q)).toBe(true)
    expect(是否纯问候('您好，请问你是谁')).toBe(false)
    expect(是否纯问候('介绍一下暮澜纪元')).toBe(false)
    expect(是否纯问候('')).toBe(false)
  })

  it('感谢与告别识别', () => {
    expect(是否感谢('谢谢')).toBe(true)
    expect(是否感谢('谢谢你')).toBe(true)
    expect(是否感谢('你好')).toBe(false)
    expect(是否告别('再见')).toBe(true)
    expect(是否告别('拜拜')).toBe(true)
    expect(是否告别('你好')).toBe(false)
  })

  it('项目卡片检测三型齐全（xrm/lovewithme/aiConsole）', () => {
    expect(检测项目卡片('介绍一下暮澜纪元')).toBe('xrm')
    expect(检测项目卡片('介绍一下和我恋爱吧')).toBe('lovewithme')
    expect(检测项目卡片('介绍一下循环工程skill')).toBe('aiConsole')
    expect(检测项目卡片('你好')).toBeUndefined()
  })
})
