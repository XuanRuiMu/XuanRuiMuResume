import { describe, it, expect } from 'vitest'
import { projects, lovewithmeGithubUrl, analyticsGithubUrl } from '../../data/projects'
import { experiences, educatorBilibiliUrl, wowguildVideoUrl } from '../../data/experience'
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

  it('恋爱吧项目链接常量全库唯一源', () => {
    const 恋爱吧项目 = projects.find((项目) => 项目.id === 'lovewithme')
    expect(恋爱吧项目?.links[0].url).toBe(lovewithmeGithubUrl)
  })

  it('FP-05：经历外链地址与用户指定一致', () => {
    const 教育 = experiences.find((条目) => 条目.id === 'educator')
    expect(教育?.links?.[0].url).toBe('https://space.bilibili.com/383504924/upload/video')
    expect(教育?.links?.[0].url).toBe(educatorBilibiliUrl)
    const 公会 = experiences.find((条目) => 条目.id === 'wowguild')
    expect(公会?.links?.[0].url).toBe(wowguildVideoUrl)
    expect(公会?.links?.[0].url.startsWith('https://www.bilibili.com/video/BV18jS9YvEyC/')).toBe(true)
    const 独立开发 = experiences.find((条目) => 条目.id === 'indie')
    expect(独立开发?.links?.[0].url).toBe(personalInfo.github)
  })

  it('FP-05：无链接经历仅限无外链三条', () => {
    expect(experiences).toHaveLength(6)
    for (const 条目 of experiences) {
      if (条目.id === 'mcserver' || 条目.id === 'bachelor' || 条目.id === 'aiengineer') {
        expect(条目.links).toBeUndefined()
      } else {
        expect(条目.links?.length).toBeGreaterThan(0)
      }
    }
  })
})
