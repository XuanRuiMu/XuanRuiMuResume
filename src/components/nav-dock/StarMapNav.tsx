import { useState } from 'react'
import { SECTION_ORDER, type AppSection } from '../../store/useAppStore'
import { t, type TranslationKey } from '../../i18n/translations'

/** 罗盘渲染尺寸（px）——紧凑且贴合 header 的 h-14 高度，不遮挡内容 */
const 罗盘尺寸 = 56
const 视图边长 = 200
const 圆心 = 视图边长 / 2

const 外环半径 = 76
const 内环半径 = 42
const 装饰环半径 = 60

interface 星体位置 {
  章节: AppSection
  角度: number
  半径: number
}

/** 9 个章节均布在 1–2 层同心轨道上：外环 5 星，内环 4 星 */
function 计算星图布局(): 星体位置[] {
  const 外环数量 = 5
  const 星体列表: 星体位置[] = []
  SECTION_ORDER.forEach((章节, 索引) => {
    if (索引 < 外环数量) {
      const 角度 = -90 + 索引 * (360 / 外环数量)
      星体列表.push({ 章节, 角度, 半径: 外环半径 })
    } else {
      const 内索引 = 索引 - 外环数量
      const 内数量 = SECTION_ORDER.length - 外环数量
      const 角度 = -90 + 45 + 内索引 * (360 / 内数量)
      星体列表.push({ 章节, 角度, 半径: 内环半径 })
    }
  })
  return 星体列表
}

const 星图布局 = 计算星图布局()

function 极坐标(角度: number, 半径: number) {
  const 弧度 = (角度 * Math.PI) / 180
  return { x: 圆心 + 半径 * Math.cos(弧度), y: 圆心 + 半径 * Math.sin(弧度) }
}

interface StarMapNavProps {
  activeSection: AppSection | null
  跳转: (章节: AppSection) => void
}

/** 自转关键帧与 reduced-motion 静止规则——自包含，不依赖构建链动画工具类 */
const 轨道样式 = `
@keyframes 轨道旋转 { to { transform: rotate(360deg); } }
.轨道旋转-慢, .轨道旋转-慢2 { transform-box: fill-box; transform-origin: center; }
.轨道旋转-慢 { animation: 轨道旋转 48s linear infinite; }
.轨道旋转-慢2 { animation: 轨道旋转 72s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .轨道旋转-慢, .轨道旋转-慢2 { animation: none; }
}
`

/**
 * 星图罗盘导航：中心为观测点，同心轨道环上分布代表各章节的"星"；
 * 当前章节对应的星高亮发光，装饰轨道环缓慢旋转（reduced-motion 时静止），
 * 悬停/聚焦某星显示章节标签；星为原生 <button>，Enter/Space 触发跳转。
 */
export function StarMapNav({ activeSection, 跳转 }: StarMapNavProps) {
  const [悬浮章节, set悬浮章节] = useState<AppSection | null>(null)

  return (
    <div
      className="relative shrink-0"
      style={{ width: 罗盘尺寸, height: 罗盘尺寸 }}
      role="group"
      aria-label={t('nav.main')}
    >
      <style>{轨道样式}</style>
      {/* 透镜底衬，提升在星河背景上的可读性 */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-glass" aria-hidden="true" />

      <svg
        viewBox={`0 0 ${视图边长} ${视图边长}`}
        width={罗盘尺寸}
        height={罗盘尺寸}
        className="absolute inset-0 block select-none"
        aria-hidden="true"
      >
        <defs>
          <filter id="星辉" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="模糊" />
            <feMerge>
              <feMergeNode in="模糊" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 静态轨道环 */}
        <circle cx={圆心} cy={圆心} r={外环半径} fill="none" stroke="var(--color-border)" strokeWidth={1} />
        <circle cx={圆心} cy={圆心} r={内环半径} fill="none" stroke="var(--color-border)" strokeWidth={1} />

        {/* 缓慢旋转的装饰轨道（prefers-reduced-motion 时静止） */}
        <g className="轨道旋转-慢">
          <circle
            cx={圆心}
            cy={圆心}
            r={装饰环半径}
            fill="none"
            stroke="var(--color-primary)"
            strokeOpacity={0.4}
            strokeWidth={1}
            strokeDasharray="3 10"
          />
        </g>
        <g className="轨道旋转-慢2">
          <circle
            cx={圆心}
            cy={圆心}
            r={外环半径 + 8}
            fill="none"
            stroke="var(--color-secondary)"
            strokeOpacity={0.3}
            strokeWidth={1}
            strokeDasharray="1 14"
          />
        </g>

        {/* 中心观测点 */}
        <circle
          cx={圆心}
          cy={圆心}
          r={4}
          fill="var(--color-surface-elevated)"
          stroke="var(--color-primary)"
          strokeWidth={1}
        />

        {/* 星体 */}
        {星图布局.map((星) => {
          const { x, y } = 极坐标(星.角度, 星.半径)
          const 激活 = activeSection === 星.章节
          const 悬浮 = 悬浮章节 === 星.章节
          const 半径 = 激活 ? 6 : 悬浮 ? 5 : 4
          return (
            <circle
              key={星.章节}
              cx={x}
              cy={y}
              r={半径}
              fill={激活 ? 'var(--color-primary)' : 'var(--color-text-secondary)'}
              opacity={激活 ? 1 : 悬浮 ? 0.95 : 0.55}
              filter={激活 ? 'url(#星辉)' : undefined}
              className={激活 ? 'motion-safe:animate-pulse' : undefined}
            />
          )
        })}
      </svg>

      {/* 透明的可交互星按钮：键盘可达，原生 Enter/Space 触发 transitionToSection */}
      {星图布局.map((星) => {
        const { x, y } = 极坐标(星.角度, 星.半径)
        const 左 = (x / 视图边长) * 100
        const 上 = (y / 视图边长) * 100
        return (
          <button
            key={星.章节}
            type="button"
            aria-label={t(`nav.${星.章节}` as unknown as TranslationKey)}
            aria-current={activeSection === 星.章节 ? 'true' : undefined}
            onClick={() => 跳转(星.章节)}
            onPointerEnter={() => set悬浮章节(星.章节)}
            onPointerLeave={() => set悬浮章节(null)}
            onFocus={() => set悬浮章节(星.章节)}
            onBlur={() => set悬浮章节(null)}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ left: `${左}%`, top: `${上}%`, width: 18, height: 18 }}
          />
        )
      })}

      {/* 悬停/聚焦章节标签（tooltip） */}
      {悬浮章节 && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-secondary shadow-lg"
        >
          {t(`nav.${悬浮章节}` as unknown as TranslationKey)}
        </div>
      )}
    </div>
  )
}
