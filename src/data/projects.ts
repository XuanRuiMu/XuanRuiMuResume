import type { Project } from './types'
import { personalInfo } from './personalInfo'

export const projects: Project[] = [
  {
    id: 'xrm',
    nameKey: 'data.projects.xrm.name',
    descKey: 'data.projects.xrm.desc',
    tags: ['Java', 'Spigot', 'MySQL', 'Redis'],
    metricKeys: ['data.projects.xrm.metrics.classes', 'data.projects.xrm.metrics.systems'],
    links: [{ labelKey: 'projects.link.github', url: personalInfo.github }],
  },
  {
    id: 'admin',
    nameKey: 'data.projects.admin.name',
    descKey: 'data.projects.admin.desc',
    tags: ['Spring Boot', 'JPA', 'JWT', 'Swagger'],
    metricKeys: ['data.projects.admin.metrics.tables', 'data.projects.admin.metrics.auth'],
    links: [{ labelKey: 'projects.link.github', url: personalInfo.github }],
  },
  {
    id: 'aiConsole',
    nameKey: 'data.projects.aiConsole.name',
    descKey: 'data.projects.aiConsole.desc',
    tags: ['Python', 'Git 自动化', 'MCP', 'API 集成'],
    metricKeys: ['data.projects.aiConsole.metrics.lines', 'data.projects.aiConsole.metrics.sources'],
    links: [{ labelKey: 'projects.link.github', url: personalInfo.github }],
  },
  {
    id: 'slimefun',
    nameKey: 'data.projects.slimefun.name',
    descKey: 'data.projects.slimefun.desc',
    tags: ['开源', 'MySQL/PostgreSQL/SQLite'],
    metricKeys: ['data.projects.slimefun.metrics.databases', 'data.projects.slimefun.metrics.contribution'],
    links: [{ labelKey: 'projects.link.github', url: 'https://github.com/Slimefun/Slimefun4' }],
  },
]
