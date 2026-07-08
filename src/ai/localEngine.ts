import type { AiMessage } from '../store/useAppStore'
import { t, type TranslationKey } from '../i18n/translations'
import { personalInfo } from '../data/personalInfo'

interface LocalRule {
  keywords: string[]
  key: 'name' | 'target' | 'contact' | 'projects' | 'skills' | 'education'
}

function formatAnswer(key: LocalRule['key']): string {
  const base = t(`chat.answers.${key}` as unknown as TranslationKey)
  return base
    .replace('{name}', personalInfo.name)
    .replace('{email}', personalInfo.email)
    .replace('{phone}', personalInfo.phone)
    .replace('{school}', personalInfo.education.school)
    .replace('{major}', personalInfo.education.major)
    .replace('{degree}', personalInfo.education.degree)
    .replace('{period}', personalInfo.education.period)
}

const RULES: LocalRule[] = [
  { keywords: ['名字', '姓名', '叫什么'], key: 'name' },
  { keywords: ['岗位', '职位', '目标'], key: 'target' },
  { keywords: ['联系方式', '邮箱', '电话'], key: 'contact' },
  { keywords: ['项目', '经验'], key: 'projects' },
  { keywords: ['技能', '技术栈'], key: 'skills' },
  { keywords: ['教育', '学校'], key: 'education' },
]

export function getLocalAnswer(input: string): AiMessage {
  const text = input.toLowerCase()
  const rule = RULES.find((item) => item.keywords.some((keyword) => text.includes(keyword)))

  return {
    role: 'assistant',
    content: rule
      ? formatAnswer(rule.key)
      : t('chat.answers.fallback' as unknown as TranslationKey).replace('{email}', personalInfo.email),
  }
}
