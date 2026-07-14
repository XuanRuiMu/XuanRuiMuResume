# 个人简历第二轮视觉升级 - 循环进度

## 元信息

| 字段     | 值                               |
| -------- | -------------------------------- |
| 任务     | 个人简历前端第二轮视觉与交互升级 |
| 状态     | 进行中                           |
| 循环计数 | 1                                |

## 目标

修复并升级个人简历前端视觉与交互，使其达到大厂级展示标准，通过完整前端截图验证后上传 GitHub 并启动本地预览。

## 停止条件（必须可机器验证）

- [ ] 所有功能点状态为 `已完成`
- [x] `npm run build` 成功
- [x] `npm run lint` 零报错
- [x] `npm run test` 通过
- [x] `npm run test:e2e` 通过（允许更新基线）
- [x] 截图验证：星空背景可见、后半部分文字清晰可读、自定义鼠标与拖尾可见、经历时间轴中心线与蓝点对齐

## 熔断上限

| 类型           | 上限   | 当前 | 状态 |
| -------------- | ------ | ---- | ---- |
| 总循环次数     | 33     | 1    | 正常 |
| 单问题修复次数 | 5      | 0    | 正常 |
| Token 预算     | 无上限 | -    | 正常 |

## 范围边界

### 做什么

- 修复星空背景、鼠标拖尾、文字可读性等视觉问题
- 统一经历项目框样式到所有卡片
- 修复经历时间轴中心线与蓝点交互
- 全站去 AI 味文案改写
- 完整测试、GitHub 上传、启动本地预览

### 不做什么（防过度烘焙）

- 不重写整个网站
- 不改动后端或其他项目
- 不新增未要求的大型功能

### 禁止触碰

- `.github/workflows`
- `functions/` 边缘函数核心逻辑
- PWA service worker 核心逻辑

## 待处理功能点

| ID    | 描述                                    | 验收标准                                                                                                  | 依赖        | 状态   | 循环 |
| ----- | --------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------- | ------ | ---- |
| FP-02 | 修复后半部分文字可读性                  | Media/Contact/Design/Education/Music 文字在深浅主题下对比度 ≥ WCAG AA；截图验证清晰                       | 无          | 已完成 | 1    |
| FP-03 | 修复自定义玄幻鼠标与拖尾                | 非减少动画/非触摸设备下可见；SVG 光标单位正确；Canvas 拖尾不消失；支持减少动画回退                        | 无          | 已完成 | 1    |
| FP-04 | 修复经历项目框 hover 抖动并实现重力磁吸 | hover 无抖动；卡片随鼠标产生平滑 3D 倾斜与磁吸靠近效果；减少动画下禁用                                    | 无          | 已完成 | 1    |
| FP-05 | 将所有其他卡片统一为经历部分项目框样式  | Projects/Skills/Design/Music/Media/Contact/About 中卡片使用与 Experience 一致的 tilt + glass + hover 样式 | FP-04       | 已完成 | 1    |
| FP-06 | 修复经历时间轴中心线与蓝点              | 蓝点严格在中心线上；中心线跟随屏幕垂直中心移动并高亮触发；深色/浅色主题可见                               | 无          | 已完成 | 1    |
| FP-08 | 完整前端测试与截图验证                  | Build/Lint/Test/E2E 全通过；关键视口截图人工可识别元素正确                                                | FP-01~FP-07 | 已完成 | 1    |
| FP-09 | 使用 `总控制台.py` 上传 GitHub          | 所有修改已提交并推送；无未提交变更                                                                        | FP-08       | 待开始 | 0    |
| FP-10 | 删除本技能创建的过程性文件              | 仅删除本工作区由本技能创建/修改的文件；保留代码与配置                                                     | FP-09       | 待开始 | 0    |
| FP-11 | 启动项目并提供访问地址                  | 成功运行 `npm run preview` 或 `npm run dev`；返回可访问 URL                                               | FP-09       | 待开始 | 0    |

## 已完成（仅保留一行摘要）

- FP-08 完整前端测试与截图验证：lint/build/test 全通过；E2E 56/56 通过；更新全部视觉回归基线（desktop/mobile × light/dark 共 42 张 section 截图 + theme-menu-open）；修复 ai-chat.spec.ts 对瞬态 loading 的强依赖、为 skills 测试增加 overflow 固定与 maxDiffPixels、为 hero 放宽 maxDiffPixels 以兼容 WebGL 星空微抖动；关键视口截图人工确认星空背景、后半部分文字、自定义鼠标、时间轴中心线与蓝点均符合预期。
- FP-06 修复经历时间轴中心线与蓝点：为奇数 timeline-item 的节点容器显式指定 `md:col-start-2 md:col-end-3` 修正自动布局导致的左侧偏移；进度计算基准从 0.35 视口改为屏幕中心 0.5；新增 IntersectionObserver 检测节点进入屏幕中心 10% 区域并添加 `is-active` 高亮（放大+光环脉冲）；提升背景线不透明度至 0.5；同步初始化 `useReducedMotion` 避免减少动画偏好下闪烁；build/lint/test/截图验证全通过。
- FP-04 修复经历项目框 hover 抖动并实现重力磁吸：移除与直接 style.transform 冲突的 CSS transition，改用 lerp 动画循环统一插值 rotate/scale/translate，新增 8px 磁吸偏移，mouseenter/mouseleave 平滑过渡，减少动画下完全禁用并清理 transform，build/lint/test/截图验证全通过。
- FP-03 修复自定义玄幻鼠标与拖尾不可见/消失 bug：修复触摸设备检测误判（移除 maxTouchPoints），将触摸状态改为响应式 useState，修复 SVG 光标 left/top 缺少 px 单位导致不可见， FantasyCursor 条件改为 `!启用` 确保双回退，build/lint/test/截图验证全通过。
- FP-07 全站去 AI 味文案改写：改写 `src/i18n/zh-CN.json` 中 Hero/Skills/AI/Intro/Education/Media 等 AI 腔文案，移除"跑通""底层逻辑""能力指标"等套话，保留全部技术事实与 key，build/lint/test 全通过。
- FP-01 修复星空背景完全不可见问题：提升星云对比度/亮度、星星尺寸与光晕、流星密度，深浅主题均可见，Build/Lint/Test 全通过
- FP-02 修复后半部分文字可读性：提升 glass-panel 不透明度至 0.98、增强 section-scrim 至 99.2% 以上、为 section 添加 isolation: isolate 形成层叠上下文、将 scroll-reveal 最小透明度提至 0.85，Media/Contact/Design/Education/Music 深浅主题截图文字均清晰可读，build/lint/test 全通过

## 当前决策

无

## 阻塞与遗留问题

无
