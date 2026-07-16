import { motion, useReducedMotion } from 'framer-motion'
import { Section } from '../../components/ui/Section'
import { t } from '../../i18n/translations'

function chaiFenJianJie(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  return trimmed
    .split(/(?<=[。；])/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function AboutSection() {
  const yingJianShaoDongHua = useReducedMotion()
  const duanLuoXing = chaiFenJianJie(t('about.intro'))

  const rongQiDongHua = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: yingJianShaoDongHua ? 0 : 0.08,
        delayChildren: yingJianShaoDongHua ? 0 : 0.05,
      },
    },
  }

  const xiangMuDongHua = {
    hidden: { opacity: 0, y: yingJianShaoDongHua ? 0 : 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: yingJianShaoDongHua ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  }

  const qiangDiaoXianDongHua = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: yingJianShaoDongHua ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] as const, delay: 0.2 },
    },
  }

  return (
    <Section id="about" title={t('about.title')}>
      <motion.div
        className="relative mx-auto max-w-4xl"
        variants={rongQiDongHua}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="border-y border-border/60 py-8 sm:py-12">
          <motion.div
            variants={xiangMuDongHua}
            className="mb-6 flex items-center gap-3 text-sm text-muted font-mono text-shadow-readable"
          >
            <span aria-hidden="true">{'//'}</span>
            <span>{t('about.caption.intro')}</span>
            <span className="ml-auto hidden text-xs opacity-60 sm:inline" aria-hidden="true">
              {t('about.caption.meta')}
            </span>
          </motion.div>

          <div className="space-y-0">
            {duanLuoXing.map((hang, index) => {
              const hangHao = String(index + 1).padStart(2, '0')
              const shiYiShuHang = index === 3
              const shiJiShuHang = index === 1

              return (
                <motion.div
                  key={index}
                  variants={xiangMuDongHua}
                  whileHover={yingJianShaoDongHua ? undefined : { x: 4 }}
                  className="group flex items-start gap-3 sm:gap-5 py-2 sm:py-3"
                >
                  <span
                    className="select-none pt-0.5 text-right text-xs text-muted/70 font-mono tabular-nums text-shadow-readable w-6 sm:w-8 shrink-0"
                    aria-hidden="true"
                  >
                    {hangHao}
                  </span>

                  <div className="relative flex-1">
                    <p
                      className={[
                        'text-base leading-relaxed sm:text-lg text-shadow-readable',
                        shiYiShuHang
                          ? 'font-display tracking-wide rotate-[-0.8deg] origin-left text-accent'
                          : 'font-mono tracking-tight text-text-primary',
                        shiJiShuHang ? 'text-primary' : '',
                      ].join(' ')}
                    >
                      {hang}
                    </p>

                    {shiYiShuHang && (
                      <motion.span
                        variants={qiangDiaoXianDongHua}
                        className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-24 origin-left rounded-full bg-gradient-to-r from-accent via-secondary to-transparent opacity-80"
                        aria-hidden="true"
                      />
                    )}

                    <span
                      className="absolute -bottom-0.5 left-0 h-px w-0 bg-border transition-all duration-300 group-hover:w-full"
                      aria-hidden="true"
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>

          <motion.div
            variants={xiangMuDongHua}
            className="mt-6 flex items-center gap-3 text-sm text-muted font-mono text-shadow-readable"
          >
            <span aria-hidden="true">{'//'}</span>
            <span>{t('about.caption.eof')}</span>
          </motion.div>
        </div>
      </motion.div>
    </Section>
  )
}
