import { eduContent, personalInfo } from '../../data/resumeData'
import { BookOpen, Users, PlayCircle } from 'lucide-react'

export function EduPanel() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-white/75 leading-relaxed">{eduContent.intro}</p>

      <div className="p-4 rounded-xl bg-white/5 border border-edu-orange/30">
        <div className="flex items-center gap-2 text-edu-orange font-medium mb-3">
          <PlayCircle size={16} />
          B站频道：{eduContent.channel.name}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {eduContent.channel.stats.map((stat) => (
            <div key={stat.label} className="text-center p-2 rounded-lg bg-white/5">
              <div className="text-lg font-semibold text-white">{stat.value}</div>
              <div className="text-[10px] text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
        <a
          href={personalInfo.bilibili}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block text-center text-xs text-edu-orange hover:underline"
        >
          访问频道主页
        </a>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
          <BookOpen size={14} /> 课程卡片
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {eduContent.courses.map((course) => (
            <div key={course.name} className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-white">{course.name}</div>
              <div className="text-[10px] text-edu-orange">{course.level}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
          <Users size={14} /> 教学经历
        </h3>
        <ul className="space-y-2">
          {eduContent.experiences.map((exp) => (
            <li key={exp} className="text-xs text-white/70 leading-relaxed flex gap-2">
              <span className="text-edu-orange">•</span>
              {exp}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
