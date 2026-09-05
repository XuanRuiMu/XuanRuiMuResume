import { describe, it, expect } from 'vitest'
import zhCN from './i18n/zh-CN.json'
import { t } from './i18n/translations'
import { music } from './data/music'
import { buildResumeKnowledgeBase } from './ai/resumeKnowledgeBase'

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectStrings)
  if (value !== null && typeof value === 'object')
    return Object.values(value as Record<string, unknown>).flatMap(collectStrings)
  return []
}

const 翻译文本 = collectStrings(zhCN).join('\n')
const 知识库文本 = buildResumeKnowledgeBase()
  .map((chunk) => chunk.content)
  .join('\n')

describe('FP-02内容一致性回归', () => {
  it('群人数多处一致为200人+', () => {
    expect(t('showcase.cards.teaching.desc')).toContain('200人+')
    expect(t('data.experience.entries.teacher.description')).toContain('200人+')
    expect(t('data.experience.entries.teacher.achievement3')).toContain('200人+')
  })

  it('翻译文本与知识库无旧事实残留', () => {
    for (const 文本 of [翻译文本, 知识库文本]) {
      expect(文本).not.toContain('283')
      expect(文本).not.toContain('逃脱')
      expect(文本).not.toContain('原创歌曲')
      expect(文本).not.toContain('突击课')
      expect(文本).not.toContain('突击辅导')
    }
  })

  it('教学口径为线下小班课计算机培训', () => {
    expect(t('data.education.achievements.crashCourse')).toContain('线下小班课计算机培训')
    expect(t('data.education.achievements.crashCourse')).toContain('免修考试')
    expect(t('showcase.cards.teaching.desc')).toContain('线下小班课计算机培训')
  })

  it('音乐域只留证书口径且无创作断言', () => {
    const 音乐文本 = [
      t('data.music.intro'),
      t('data.music.tracks.escape.name'),
      t('data.music.tracks.escape.type'),
      t('data.music.tracks.escape.desc'),
      t('showcase.cards.escape.title'),
      t('showcase.cards.escape.desc'),
      t('data.experience.entries.multimedia.achievement1'),
      t('data.radar.dimensions.musicCreation.description'),
    ].join('\n')
    expect(音乐文本).toContain('架子鼓九级证书')
    for (const 断言 of [
      '原创歌曲',
      '逃脱',
      '编曲',
      '作曲',
      '母带',
      '写歌',
      '吉他',
      'MIDI',
      'Kontakt',
      '音乐创作',
      '程序化音乐',
    ]) {
      expect(音乐文本).not.toContain(断言)
    }
    expect(music.skillKeys).not.toContain('data.music.skills.guitar')
    expect(music.skillKeys).not.toContain('data.music.skills.kontakt')
    expect(music.skillKeys).not.toContain('data.music.skills.midi')
    expect(music.toolKeys).not.toContain('data.music.skills.kontakt')
    expect(music.toolKeys).not.toContain('data.music.skills.midi')
  })
})
