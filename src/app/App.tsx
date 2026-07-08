import { lazy, Suspense } from 'react'
import { Layout } from './layout'
import { HeroSection } from '../features/hero/HeroSection'

const AboutSection = lazy(() =>
  import('../features/about/AboutSection').then((module) => ({ default: module.AboutSection }))
)
const ProjectsSection = lazy(() =>
  import('../features/projects/ProjectsSection').then((module) => ({ default: module.ProjectsSection }))
)
const SkillsSection = lazy(() =>
  import('../features/skills/SkillsSection').then((module) => ({ default: module.SkillsSection }))
)
const ExperienceSection = lazy(() =>
  import('../features/experience/ExperienceSection').then((module) => ({ default: module.ExperienceSection }))
)
const EducationSection = lazy(() =>
  import('../features/education/EducationSection').then((module) => ({ default: module.EducationSection }))
)
const DesignSection = lazy(() =>
  import('../features/design/DesignSection').then((module) => ({ default: module.DesignSection }))
)
const MusicSection = lazy(() =>
  import('../features/music/MusicSection').then((module) => ({ default: module.MusicSection }))
)
const MediaSection = lazy(() =>
  import('../features/media/MediaSection').then((module) => ({ default: module.MediaSection }))
)
const ContactSection = lazy(() =>
  import('../features/contact/ContactSection').then((module) => ({ default: module.ContactSection }))
)

function SectionFallback() {
  return <div className="min-h-[40vh] w-full" aria-hidden="true" />
}

export default function App() {
  return (
    <Layout>
      <HeroSection />
      <Suspense fallback={<SectionFallback />}>
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <ExperienceSection />
        <EducationSection />
        <DesignSection />
        <MusicSection />
        <MediaSection />
        <ContactSection />
      </Suspense>
    </Layout>
  )
}
