import type { TranslationKey } from '../i18n/translations'

export interface ShowcaseCard {
  id: string
  titleKey: TranslationKey
  descKey: TranslationKey
  href?: string
}

export interface ShowcaseRow {
  /** 锚点 id（沿用原 education / design / media，导航跳转不变） */
  anchorId: string
  cards: ShowcaseCard[]
}

/**
 * 作品展示区：按内容分为三个板块，每板块一排卡片，
 * 由 12-next-spline-3d HeroParallax 视差布局承载。板块标签已移除，仅保留纯粹的方块项目。
 */
export const showcaseRows: ShowcaseRow[] = [
  {
    anchorId: 'education',
    cards: [
      { id: 'degree', titleKey: 'showcase.cards.degree.title', descKey: 'showcase.cards.degree.desc' },
      {
        id: 'coding',
        titleKey: 'showcase.cards.coding.title',
        descKey: 'showcase.cards.coding.desc',
        href: 'https://www.bilibili.com/video/BV11r421j7UV',
      },
      {
        id: 'systems',
        titleKey: 'showcase.cards.systems.title',
        descKey: 'showcase.cards.systems.desc',
        href: 'https://www.bilibili.com/video/BV1x36HYjEoA',
      },
      {
        id: 'lowlevel',
        titleKey: 'showcase.cards.lowlevel.title',
        descKey: 'showcase.cards.lowlevel.desc',
        href: 'https://www.bilibili.com/video/BV1Cw4m1R7SN',
      },
      {
        id: 'teaching',
        titleKey: 'showcase.cards.teaching.title',
        descKey: 'showcase.cards.teaching.desc',
        href: 'https://www.bilibili.com/video/BV1UYGy6rEmj',
      },
      {
        id: 'assembly',
        titleKey: 'showcase.cards.assembly.title',
        descKey: 'showcase.cards.assembly.desc',
        href: 'https://www.bilibili.com/video/BV1ghmfYCELF',
      },
      {
        id: 'arch',
        titleKey: 'showcase.cards.arch.title',
        descKey: 'showcase.cards.arch.desc',
        href: 'https://www.bilibili.com/video/BV12TVfzfEVu',
      },
      {
        id: 'marx',
        titleKey: 'showcase.cards.marx.title',
        descKey: 'showcase.cards.marx.desc',
        href: 'https://www.bilibili.com/video/BV11m421K7vq',
      },
    ],
  },
  {
    anchorId: 'design',
    cards: [
      {
        id: 'resumeTheater',
        titleKey: 'showcase.cards.resumeTheater.title',
        descKey: 'showcase.cards.resumeTheater.desc',
        href: 'https://github.com/XuanRuiMu/XuanRuiMuResume',
      },
      { id: 'xrmUi', titleKey: 'showcase.cards.xrmUi.title', descKey: 'showcase.cards.xrmUi.desc' },
      { id: 'aiToolchain', titleKey: 'showcase.cards.aiToolchain.title', descKey: 'showcase.cards.aiToolchain.desc' },
      { id: 'toolbox', titleKey: 'showcase.cards.toolbox.title', descKey: 'showcase.cards.toolbox.desc' },
      { id: 'generative', titleKey: 'showcase.cards.generative.title', descKey: 'showcase.cards.generative.desc' },
    ],
  },
  {
    anchorId: 'media',
    cards: [
      { id: 'novel', titleKey: 'showcase.cards.novel.title', descKey: 'showcase.cards.novel.desc' },
      {
        id: 'comedy',
        titleKey: 'showcase.cards.comedy.title',
        descKey: 'showcase.cards.comedy.desc',
        href: 'https://www.bilibili.com/video/BV1vkDGY8Eyw',
      },
      { id: 'gameWorld', titleKey: 'showcase.cards.gameWorld.title', descKey: 'showcase.cards.gameWorld.desc' },
      {
        id: 'courses',
        titleKey: 'showcase.cards.courses.title',
        descKey: 'showcase.cards.courses.desc',
        href: 'https://space.bilibili.com/383504924',
      },
      { id: 'escape', titleKey: 'showcase.cards.escape.title', descKey: 'showcase.cards.escape.desc' },
    ],
  },
  {
    anchorId: 'opensource',
    cards: [
      {
        id: 'repoLoop',
        titleKey: 'showcase.cards.repoLoop.title',
        descKey: 'showcase.cards.repoLoop.desc',
        href: 'https://github.com/XuanRuiMu/loop-engineering',
      },
      {
        id: 'repoLove',
        titleKey: 'showcase.cards.repoLove.title',
        descKey: 'showcase.cards.repoLove.desc',
        href: 'https://github.com/XuanRuiMu/HeWoLianAiBa',
      },
      {
        id: 'repoData',
        titleKey: 'showcase.cards.repoData.title',
        descKey: 'showcase.cards.repoData.desc',
        href: 'https://github.com/XuanRuiMu/LianAiBaDataCenter',
      },
    ],
  },
]
