import { useState, useCallback, type FormEvent } from 'react'
import { Mail, ExternalLink, Send } from 'lucide-react'
import { z } from 'zod'
import { Section } from '../../components/ui/Section'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { personalInfo } from '../../data/personalInfo'
import { t } from '../../i18n/translations'
import { useContactSubmit } from '../../lib/api'

interface FormValues {
  name: string
  email: string
  message: string
  website: string
}

interface FormErrors {
  name?: string
  email?: string
  message?: string
}

const BilibiliIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
    <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" />
  </svg>
)

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
    <path d="M12 1C5.925 1 1 5.925 1 12c0 4.86 3.152 8.983 7.523 10.437.55.101.753-.238.753-.529 0-.262-.01-1.129-.015-2.048-3.064.665-3.71-1.46-3.71-1.46-.501-1.273-1.224-1.613-1.224-1.613-.999-.683.076-.669.076-.669 1.105.078 1.686 1.134 1.686 1.134.982 1.682 2.576 1.196 3.204.915.1-.711.384-1.196.699-1.471-2.446-.278-5.018-1.223-5.018-5.445 0-1.202.43-2.185 1.134-2.954-.114-.278-.491-1.397.108-2.91 0 0 .925-.296 3.03 1.129a10.56 10.56 0 0 1 2.752-.37 10.58 10.58 0 0 1 2.752.37c2.104-1.425 3.028-1.129 3.028-1.129.6 1.513.223 2.632.109 2.91.705.769 1.133 1.752 1.133 2.954 0 4.232-2.576 5.163-5.028 5.437.395.34.747 1.01.747 2.036 0 1.471-.014 2.657-.014 3.018 0 .294.2.634.756.527C19.852 20.979 23 16.857 23 12c0-6.075-4.925-11-11-11z" />
  </svg>
)

export function ContactSection() {
  const [values, setValues] = useState<FormValues>({ name: '', email: '', message: '', website: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const { mutateAsync: submitContact } = useContactSubmit()

  const createSchema = useCallback(
    () =>
      z.object({
        name: z.string().min(1, t('contact.validation.nameRequired')),
        email: z.string().min(1, t('contact.validation.emailRequired')).email(t('contact.validation.emailInvalid')),
        message: z.string().min(10, t('contact.validation.messageMin')).max(500, t('contact.validation.messageMax')),
      }),
    []
  )

  const handleChange = useCallback((field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setStatus('idle')

      const schema = createSchema()
      const result = schema.safeParse(values)
      if (!result.success) {
        const formatted: FormErrors = {}
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof FormErrors
          if (!formatted[field]) {
            formatted[field] = issue.message
          }
        }
        setErrors(formatted)
        return
      }

      setStatus('submitting')
      try {
        await submitContact({
          name: values.name,
          email: values.email,
          message: values.message,
          website: values.website,
        })
        setStatus('success')
        setValues({ name: '', email: '', message: '', website: '' })
      } catch {
        setStatus('error')
      }
    },
    [values, createSchema, submitContact]
  )

  const contactLinks = [
    {
      id: 'email',
      label: t('contact.info.email'),
      value: personalInfo.email,
      href: `mailto:${personalInfo.email}`,
      icon: Mail,
    },
    {
      id: 'github',
      label: t('contact.info.github'),
      value: 'XuanRuiMu',
      href: personalInfo.github,
      icon: GithubIcon,
    },
    {
      id: 'bilibili',
      label: t('contact.info.bilibili'),
      value: '玄锐暮',
      href: personalInfo.bilibili,
      icon: BilibiliIcon,
    },
  ]

  return (
    <Section id="contact" title={t('contact.title')} subtitle={t('contact.subtitle')}>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="grid gap-4">
          {contactLinks.map((link) => {
            const Icon = link.icon
            return (
              <Card key={link.id} hover tilt glass className="scroll-reveal-item">
                <a
                  href={link.href}
                  target={link.id === 'email' ? undefined : '_blank'}
                  rel={link.id === 'email' ? undefined : 'noopener noreferrer'}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-elevated text-primary">
                    <Icon />
                  </div>
                  <div>
                    <p className="text-sm text-muted">{link.label}</p>
                    <p className="font-medium text-text-primary">{link.value}</p>
                  </div>
                  {link.id !== 'email' && <ExternalLink size={16} className="ml-auto text-muted" aria-hidden="true" />}
                </a>
              </Card>
            )
          })}
        </div>

        <Card hover={false} tilt={false} glass className="scroll-reveal-item">
          <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
            <div>
              <label htmlFor="contact-name" className="mb-1.5 block text-sm text-text-secondary">
                {t('contact.form.name')}
              </label>
              <input
                id="contact-name"
                type="text"
                value={values.name}
                onChange={(event) => handleChange('name', event.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'contact-name-error' : undefined}
              />
              {errors.name && (
                <p id="contact-name-error" className="mt-1.5 text-xs text-accent">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contact-email" className="mb-1.5 block text-sm text-text-secondary">
                {t('contact.form.email')}
              </label>
              <input
                id="contact-email"
                type="email"
                value={values.email}
                onChange={(event) => handleChange('email', event.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'contact-email-error' : undefined}
              />
              {errors.email && (
                <p id="contact-email-error" className="mt-1.5 text-xs text-accent">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contact-message" className="mb-1.5 block text-sm text-text-secondary">
                {t('contact.form.message')}
              </label>
              <textarea
                id="contact-message"
                rows={4}
                value={values.message}
                onChange={(event) => handleChange('message', event.target.value)}
                className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                aria-invalid={errors.message ? 'true' : 'false'}
                aria-describedby={errors.message ? 'contact-message-error' : undefined}
              />
              {errors.message && (
                <p id="contact-message-error" className="mt-1.5 text-xs text-accent">
                  {errors.message}
                </p>
              )}
            </div>

            <input
              type="text"
              name="website"
              value={values.website}
              onChange={(event) => handleChange('website', event.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <Button type="submit" loading={status === 'submitting'} icon={<Send size={18} />}>
              {status === 'submitting' ? t('contact.form.sending') : t('contact.form.submit')}
            </Button>

            {status === 'success' && <p className="text-sm text-primary">{t('contact.form.success')}</p>}
            {status === 'error' && <p className="text-sm text-accent">{t('contact.form.error')}</p>}
          </form>
        </Card>
      </div>
    </Section>
  )
}
