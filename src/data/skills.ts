import type { CapabilityCard, SkillGroup } from './types'

export const itCapabilityCards: CapabilityCard[] = [
  {
    id: 'planner',
    titleKey: 'data.skills.it.cards.planner.title',
    itemsKey: 'data.skills.it.cards.planner.items',
  },
  {
    id: 'coder',
    titleKey: 'data.skills.it.cards.coder.title',
    itemsKey: 'data.skills.it.cards.coder.items',
  },
  {
    id: 'reviewer',
    titleKey: 'data.skills.it.cards.reviewer.title',
    itemsKey: 'data.skills.it.cards.reviewer.items',
  },
  {
    id: 'debugger',
    titleKey: 'data.skills.it.cards.debugger.title',
    itemsKey: 'data.skills.it.cards.debugger.items',
  },
]

export const skillGroups: SkillGroup[] = [
  {
    category: 'it',
    labelKey: 'data.skills.it.headline',
    items: [
      'data.skills.it.items.javaBackend',
      'data.skills.it.items.springBoot',
      'data.skills.it.items.aiAgent',
      'data.skills.it.items.pythonAutomation',
      'data.skills.it.items.reactThree',
      'data.skills.it.items.database',
      'data.skills.it.items.devOps',
      'data.skills.it.items.apiDesign',
    ],
  },
  {
    category: 'edu',
    labelKey: 'data.skills.education.headline',
    items: [
      'data.skills.education.items.courseDesign',
      'data.skills.education.items.thesisGuidance',
      'data.skills.education.items.knowledgeBreakdown',
      'data.skills.education.items.communityQna',
      'data.skills.education.items.visualization',
    ],
  },
  {
    category: 'design',
    labelKey: 'data.design.headline',
    items: [
      'data.design.tools.figma',
      'data.design.tools.threejs',
      'data.design.tools.tailwind',
      'data.design.tools.uiux',
      'data.design.tools.3d',
      'data.design.tools.branding',
    ],
  },
  {
    category: 'music',
    labelKey: 'data.music.headline',
    items: [
      'data.music.skills.drums',
      'data.music.skills.guitar',
      'data.music.skills.theory',
      'data.music.skills.kontakt',
      'data.music.skills.midi',
      'data.music.skills.spectrum',
    ],
  },
  {
    category: 'media',
    labelKey: 'data.skills.media.headline',
    items: [
      'data.skills.media.items.techWriting',
      'data.skills.media.items.videoEditing',
      'data.skills.media.items.novelWriting',
      'data.skills.media.items.comedyWriting',
      'data.skills.media.items.gameDesign',
    ],
  },
]
