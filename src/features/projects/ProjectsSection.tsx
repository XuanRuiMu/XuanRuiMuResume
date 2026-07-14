import { ExternalLink } from 'lucide-react'
import { projects } from '../../data/projects'
import type { Project } from '../../data/types'
import { Section } from '../../components/ui/Section'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Tag } from '../../components/ui/Tag'
import { t } from '../../i18n/translations'

interface ProjectCardProps {
  project: Project
}

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
    <path d="M12 1C5.925 1 1 5.925 1 12c0 4.86 3.152 8.983 7.523 10.437.55.101.753-.238.753-.529 0-.262-.01-1.129-.015-2.048-3.064.665-3.71-1.46-3.71-1.46-.501-1.273-1.224-1.613-1.224-1.613-.999-.683.076-.669.076-.669 1.105.078 1.686 1.134 1.686 1.134.982 1.682 2.576 1.196 3.204.915.1-.711.384-1.196.699-1.471-2.446-.278-5.018-1.223-5.018-5.445 0-1.202.43-2.185 1.134-2.954-.114-.278-.491-1.397.108-2.91 0 0 .925-.296 3.03 1.129a10.56 10.56 0 0 1 2.752-.37 10.58 10.58 0 0 1 2.752.37c2.104-1.425 3.028-1.129 3.028-1.129.6 1.513.223 2.632.109 2.91.705.769 1.133 1.752 1.133 2.954 0 4.232-2.576 5.163-5.028 5.437.395.34.747 1.01.747 2.036 0 1.471-.014 2.657-.014 3.018 0 .294.2.634.756.527C19.852 20.979 23 16.857 23 12c0-6.075-4.925-11-11-11z" />
  </svg>
)

function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card hover tilt glass className="scroll-reveal-item flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {project.metricKeys?.map((key) => (
          <Badge key={key} color="cyan">
            {t(key)}
          </Badge>
        ))}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-text-primary">{t(project.nameKey)}</h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-text-secondary">{t(project.descKey)}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
      {project.links && project.links.length > 0 && (
        <div className="flex flex-wrap gap-4 border-t border-border pt-4">
          {project.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-secondary"
            >
              {link.labelKey === 'projects.link.github' ? <GithubIcon /> : <ExternalLink size={16} />}
              {t(link.labelKey)}
            </a>
          ))}
        </div>
      )}
    </Card>
  )
}

export function ProjectsSection() {
  return (
    <Section id="projects" title={t('projects.title')} subtitle={t('projects.subtitle')}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </Section>
  )
}
