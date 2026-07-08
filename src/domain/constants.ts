import type { SectionId, SectionMeta, QualityLevel } from './types'

export const SECTIONS = {
  IT: 'it',
  EDU: 'edu',
  DESIGN: 'design',
  MUSIC: 'music',
  MEDIA: 'media',
} as const satisfies Record<string, SectionId>

export const SECTION_ORDER: SectionId[] = ['it', 'edu', 'design', 'music', 'media']

export const SECTION_META: Record<SectionId, SectionMeta> = {
  [SECTIONS.IT]: {
    id: SECTIONS.IT,
    title: 'IT',
    subtitle: 'Agent 节点网络',
    color: '#00D9FF',
    darkColor: '#0A1628',
    description: 'Java 后端 / AI 应用 / 全栈开发',
  },
  [SECTIONS.EDU]: {
    id: SECTIONS.EDU,
    title: '教育',
    subtitle: '知识晶体',
    color: '#FF9F43',
    darkColor: '#3D2815',
    description: '课程视频 / 论文指导 / 一对一辅导',
  },
  [SECTIONS.DESIGN]: {
    id: SECTIONS.DESIGN,
    title: '设计',
    subtitle: '不可能几何',
    color: '#A55EEA',
    darkColor: '#241333',
    description: 'UI/UX / 3D 视觉 / 品牌设计',
  },
  [SECTIONS.MUSIC]: {
    id: SECTIONS.MUSIC,
    title: '音乐',
    subtitle: '全息鼓组',
    color: '#A855F7',
    darkColor: '#1F0D33',
    description: '作曲 / 编曲 / 乐器系统',
  },
  [SECTIONS.MEDIA]: {
    id: SECTIONS.MEDIA,
    title: '娱乐与其他',
    subtitle: '创作工坊',
    color: '#FF6B9D',
    darkColor: '#33121C',
    description: '写作 / 相声 / 游戏 / 视频',
  },
}

export const QUALITY_LEVELS = {
  ULTRA: 'ultra',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const satisfies Record<string, QualityLevel>
