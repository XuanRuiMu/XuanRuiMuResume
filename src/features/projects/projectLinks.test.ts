import { describe, it, expect } from 'vitest'
import { projects, lovewithmeGithubUrl, analyticsGithubUrl } from '../../data/projects'
import { experiences } from '../../data/experience'
import { personalInfo } from '../../data/personalInfo'

describe('项目链接完整性', () => {
  it('每个项目至少有一个有效GitHub链接', () => {
    expect(projects.length).toBeGreaterThan(0)
    for (const 项目 of projects) {
      expect(项目.links.length).toBeGreaterThan(0)
      for (const 链接 of 项目.links) {
        expect(链接.url.startsWith('https://github.com/')).toBe(true)
      }
    }
  })

  it('数据中心项目链接精确等于用户指定地址', () => {
    expect(analyticsGithubUrl).toBe('https://github.com/XuanRuiMu/LianAiBaDataCenter')
    const 数据中心 = projects.find((项目) => 项目.id === 'analytics')
    expect(数据中心).toBeDefined()
    expect(数据中心?.links[0].url).toBe('https://github.com/XuanRuiMu/LianAiBaDataCenter')
  })

  it('恋爱吧链接常量全库唯一源', () => {
    const 恋爱吧项目 = projects.find((项目) => 项目.id === 'lovewithme')
    const 恋爱吧经历 = experiences.find((条目) => 条目.id === 'lovewithme')
    expect(恋爱吧项目?.links[0].url).toBe(lovewithmeGithubUrl)
    expect(恋爱吧经历?.links?.[0].url).toBe(lovewithmeGithubUrl)
  })

  it('经历区项目链接与项目区一致', () => {
    const 恋爱吧项目 = projects.find((项目) => 项目.id === 'lovewithme')
    const 恋爱吧经历 = experiences.find((条目) => 条目.id === 'lovewithme')
    expect(恋爱吧经历?.links?.[0].url).toBe(恋爱吧项目?.links[0].url)
    const 玄锐暮经历 = experiences.find((条目) => 条目.id === 'xrm')
    expect(玄锐暮经历?.links?.[0].url).toBe(personalInfo.github)
  })

  it('无链接经历仅限教学与多媒体', () => {
    for (const 条目 of experiences) {
      if (条目.id === 'teacher' || 条目.id === 'multimedia') {
        expect(条目.links).toBeUndefined()
      } else {
        expect(条目.links?.length).toBeGreaterThan(0)
      }
    }
  })
})
