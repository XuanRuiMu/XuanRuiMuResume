import { personalInfo } from '../data/personalInfo'
import { projects } from '../data/projects'
import { skillGroups, itCapabilityCards } from '../data/skills'
import { experiences } from '../data/experience'
import { education } from '../data/education'
import { design } from '../data/design'
import { music } from '../data/music'
import { media } from '../data/media'
import { t, ta } from '../i18n/translations'

export interface KnowledgeChunk {
  id: string
  content: string
  metadata: {
    category: string
    source: string
  }
}

function chunk(id: string, content: string, category: string, source: string): KnowledgeChunk {
  return {
    id,
    content: content.trim(),
    metadata: { category, source },
  }
}

function buildPersonalInfoChunks(): KnowledgeChunk[] {
  const info = personalInfo
  return [
    chunk(
      'personal-info-bio',
      `姓名：${info.name}。年龄：${info.age}岁。所在地：${info.location}。求职方向：${t(info.targetKey)}。期望城市：${t(info.expectedCityKey)}。薪资期望：${info.salary}。到岗时间：${t(info.availabilityKey)}。`,
      'personalInfo',
      'personalInfo.ts'
    ),
    chunk(
      'personal-info-contact',
      `联系方式：邮箱 ${info.email}，电话 ${info.phone}，GitHub ${info.github}，B站 ${info.bilibili}。`,
      'personalInfo',
      'personalInfo.ts'
    ),
    chunk(
      'personal-info-education',
      `教育背景：${info.education.school}，${info.education.major}，${info.education.degree}，${info.education.period}。`,
      'education',
      'personalInfo.ts'
    ),
  ]
}

function buildProjectChunks(): KnowledgeChunk[] {
  return projects.map((project) => {
    const metrics = project.metricKeys?.map((key) => t(key)).join('，') ?? ''
    const links = project.links?.map((link) => `${t(link.labelKey)}：${link.url}`).join('，') ?? ''
    return chunk(
      `project-${project.id}`,
      `项目：${t(project.nameKey)}。描述：${t(project.descKey)}。技术标签：${project.tags.join('、')}。${metrics ? `关键指标：${metrics}。` : ''}${links ? `相关链接：${links}。` : ''}`,
      'projects',
      'projects.ts'
    )
  })
}

function buildSkillChunks(): KnowledgeChunk[] {
  const groupChunks = skillGroups.map((group) =>
    chunk(
      `skills-${group.category}`,
      `${t(group.labelKey)}：${group.items.map((key) => t(key)).join('、')}。`,
      'skills',
      'skills.ts'
    )
  )

  const cardChunks = itCapabilityCards.map((card) =>
    chunk(
      `skills-card-${card.id}`,
      `能力角色 ${t(card.titleKey)}：${ta(card.itemsKey).join('、')}。`,
      'skills',
      'skills.ts'
    )
  )

  return [...groupChunks, ...cardChunks]
}

function buildExperienceChunks(): KnowledgeChunk[] {
  return experiences.map((entry) =>
    chunk(
      `experience-${entry.id}`,
      `经历：${t(entry.titleKey)}。机构：${entry.organizationKey ? t(entry.organizationKey) : '个人'}。时间：${t(entry.periodKey)}。描述：${entry.descriptionKeys.map((key) => t(key)).join(' ')}。`,
      'experience',
      'experience.ts'
    )
  )
}

function buildEducationChunks(): KnowledgeChunk[] {
  const summary = education.summary
  const courses = education.courses.map((course) => `${t(course.nameKey)}（${t(course.levelKey)}）`).join('、')
  const achievements = education.achievementKeys.map((key) => t(key)).join('；')

  return [
    chunk(
      'education-summary',
      `教育概览：${summary.school}，${summary.major}，${summary.degree}，${summary.period}。`,
      'education',
      'education.ts'
    ),
    chunk('education-courses', `主修与自学课程：${courses}。`, 'education', 'education.ts'),
    chunk('education-achievements', `教育成果：${achievements}。`, 'education', 'education.ts'),
  ]
}

function buildDesignChunks(): KnowledgeChunk[] {
  const workChunks = design.works.map((work) =>
    chunk(
      `design-work-${work.id}`,
      `设计作品：${t(work.nameKey)}。分类：${t(work.categoryKey)}。描述：${t(work.descKey)}。`,
      'design',
      'design.ts'
    )
  )

  return [
    chunk('design-headline', `${t(design.headlineKey)}：${t(design.introKey)}`, 'design', 'design.ts'),
    chunk('design-tools', `设计工具：${design.toolKeys.map((key) => t(key)).join('、')}。`, 'design', 'design.ts'),
    ...workChunks,
  ]
}

function buildMusicChunks(): KnowledgeChunk[] {
  const trackChunks = music.tracks.map((track) =>
    chunk(
      `music-track-${track.id}`,
      `音乐作品：${t(track.nameKey)}。类型：${t(track.typeKey)}。描述：${t(track.descKey)}。`,
      'music',
      'music.ts'
    )
  )

  return [
    chunk('music-headline', `${t(music.headlineKey)}：${t(music.introKey)}`, 'music', 'music.ts'),
    chunk('music-skills', `音乐技能与工具：${music.skillKeys.map((key) => t(key)).join('、')}。`, 'music', 'music.ts'),
    ...trackChunks,
  ]
}

function buildMediaChunks(): KnowledgeChunk[] {
  const categoryChunks = media.categories.map((category) =>
    chunk(
      `media-category-${category.id}`,
      `${t(category.labelKey)}：${category.itemKeys.map((key) => t(key)).join('、')}。`,
      'media',
      'media.ts'
    )
  )

  const timelineChunks = media.timeline.map((event) =>
    chunk(`media-timeline-${event.year}`, `${event.year}年：${t(event.eventKey)}`, 'media', 'media.ts')
  )

  return [
    chunk('media-headline', `${t(media.headlineKey)}：${t(media.introKey)}`, 'media', 'media.ts'),
    ...categoryChunks,
    ...timelineChunks,
  ]
}

export function buildResumeKnowledgeBase(): KnowledgeChunk[] {
  return [
    ...buildPersonalInfoChunks(),
    ...buildProjectChunks(),
    ...buildSkillChunks(),
    ...buildExperienceChunks(),
    ...buildEducationChunks(),
    ...buildDesignChunks(),
    ...buildMusicChunks(),
    ...buildMediaChunks(),
  ]
}

export const resumeKnowledgeBase: KnowledgeChunk[] = buildResumeKnowledgeBase()
