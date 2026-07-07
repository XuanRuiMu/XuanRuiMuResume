import { create } from 'zustand'

export const SECTIONS = {
  IT: 'it',
  EDU: 'edu',
  DESIGN: 'design',
  MUSIC: 'music',
  MEDIA: 'media',
}

export const SECTION_ORDER = [SECTIONS.IT, SECTIONS.EDU, SECTIONS.DESIGN, SECTIONS.MUSIC, SECTIONS.MEDIA]

export const SECTION_META = {
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

export const useTheaterStore = create((set, get) => ({
  activeSection: null,
  hoveredSection: null,
  transitioning: false,
  audioEnabled: false,
  cameraTarget: null,
  scrollProgress: 0,
  scrollSectionIndex: 0,
  scrollSection: null,

  setActiveSection: (section) => {
    if (get().transitioning) return
    set({ activeSection: section, transitioning: true })
    setTimeout(() => set({ transitioning: false }), 1200)
  },

  returnToTheater: () => {
    if (get().transitioning) return
    set({ activeSection: null, transitioning: true })
    setTimeout(() => set({ transitioning: false }), 900)
  },

  setHoveredSection: (section) => set({ hoveredSection: section }),
  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setScrollProgress: (progress, index, section) =>
    set({ scrollProgress: progress, scrollSectionIndex: index, scrollSection: section }),
}))
