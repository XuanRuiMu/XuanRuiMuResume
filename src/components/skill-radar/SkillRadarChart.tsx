import { useMemo, useState } from 'react'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts'
import { skillMetrics } from '../../data/skillMetrics'
import { t } from '../../i18n/translations'

interface 雷达数据点 {
  标签: string
  分数: number
  描述: string
  分类: string
}

interface 雷达提示框属性 {
  active?: boolean
  payload?: Array<{ payload: 雷达数据点 }>
}

function 雷达提示框({ active, payload }: 雷达提示框属性) {
  if (active && payload && payload.length > 0) {
    const 数据 = payload[0].payload
    return (
      <div className="max-w-[220px] rounded-lg border border-border bg-surface px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-text-primary">{数据.标签}</p>
        <p className="text-xs text-primary">{数据.分数} 分</p>
        <p className="text-xs text-text-secondary">{数据.描述}</p>
      </div>
    )
  }
  return null
}

export function SkillRadarChart() {
  const [高亮索引, 设置高亮索引] = useState<number | null>(null)

  const 雷达数据 = useMemo<雷达数据点[]>(
    () =>
      skillMetrics.map((metric) => ({
        标签: t(metric.dimensionKey),
        分数: metric.score,
        描述: t(metric.descriptionKey),
        分类: metric.category,
      })),
    []
  )

  return (
    <div className="relative h-full w-full" onMouseLeave={() => 设置高亮索引(null)}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={雷达数据} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="标签"
            tick={(props) => {
              const { x, y, payload, index } = props as {
                x: number
                y: number
                payload: { value: string }
                index: number
              }
              const 高亮 = 高亮索引 === index
              return (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={`text-[10px] transition-colors duration-200 ${高亮 ? 'fill-primary font-medium' : 'fill-text-secondary'}`}
                >
                  {payload.value}
                </text>
              )
            }}
          />
          <Tooltip content={<雷达提示框 />} cursor={false} />
          <Radar
            name={t('skills.radarTitle')}
            dataKey="分数"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={高亮索引 === null ? 0.25 : 0.12}
            isAnimationActive
            animationDuration={1000}
            animationBegin={0}
            dot={(props) => {
              const { cx, cy, index } = props as unknown as {
                cx?: number
                cy?: number
                index?: number
              }
              if (typeof cx !== 'number' || typeof cy !== 'number' || typeof index !== 'number') {
                return null
              }
              const 高亮 = 高亮索引 === index
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={高亮 ? 5 : 3}
                  fill="var(--color-primary)"
                  data-testid={`radar-point-${index}`}
                  onMouseEnter={() => 设置高亮索引(index)}
                />
              )
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
      {高亮索引 !== null && (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-border bg-surface/90 px-3 py-2 backdrop-blur-sm">
          <p className="text-sm font-medium text-text-primary" data-testid="radar-detail-label">
            {雷达数据[高亮索引].标签}
          </p>
          <p className="text-xs text-primary" data-testid="radar-detail-score">
            {雷达数据[高亮索引].分数} 分
          </p>
          <p className="max-w-[220px] text-xs text-text-secondary" data-testid="radar-detail-desc">
            {雷达数据[高亮索引].描述}
          </p>
        </div>
      )}
    </div>
  )
}
