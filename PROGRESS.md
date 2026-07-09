# 循环工程：简历网站 2026 前沿技术升级

## 元信息

- 项目：`xuanruimu-resume`（个人简历）
- 启动时间：2026-07-09
- 当前阶段：阶段3自主循环
- 总循环上限：24 轮（8 个功能点 × 3）
- 单问题修复上限：5 次
- 当前循环次数：3

## 目标

将简历网站从“技术底座完善但显性体验不足”升级为“2026 年技术栈全开、视觉冲击强烈、AI 交互原生、架构深化的个人品牌站点”。以最终效果为最高优先级，WebGPU 3D 技能星系为视觉核心，生成式 AI 助手为交互核心，原生 CSS 高级动效为大厂感载体，React 19 编译器为性能/架构底座。

## 停止条件（必须全部满足）

1. 所有功能点状态为 `已完成` 或 `已跳过`
2. `npm run build` 成功且产物正确
3. `npm run lint` 零报错
4. `npm run test` 全部通过（含新增测试）
5. Playwright 前台视觉验证通过：桌面 1920×1080 + 移动 375×812，深色/浅色主题各至少 8 张关键截图
6. AI 助手可成功渲染至少 4 种生成式 UI 组件
7. WebGPU 3D 场景在支持设备上正常渲染，不支持时优雅降级
8. 代码通过 总控制台.py 提交到 GitHub

## 范围边界

### 做什么

- WebGPU 3D 技能星系/个人品牌视觉层（大效果优先）
- 生成式 AI 助手：结构化输出 + 组件注册表 + deepseek-v4
- 原生 CSS 高级动效：Container Queries、Anchor Positioning、Scroll-Driven Animations、View Transitions、OKLCH
- React 19 编译器启用与架构深化
- 全站整合、视觉验证、GitHub 提交

### 不做什么

- 不重构业务数据层（`src/data/*` 保持现有结构）
- 不更换 UI 设计系统主题色（沿用现有品牌色）
- 不做后端服务或数据库迁移
- 不添加新的 LLM 提供商（仅 deepseek-v4）
- 不强制要求所有浏览器都显示 WebGPU 效果（渐进增强）

### 禁止触碰

- `src/data/personalInfo.ts` 中的个人隐私信息
- `src/sw.ts` 中已有的缓存策略核心逻辑（可追加 Speculation Rules）
- 总控制台.py（仅调用，不修改）

## 待处理功能点

| ID    | 描述                         | 验收标准                                                                                                                                                                   | 依赖                | 状态   |
| ----- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------ |
| FP-01 | React 19 Compiler 与架构基线 | 启用 React Compiler；AIChat 表单改用 useActionState + useOptimistic；PWA 增加 Speculation Rules；build/test/lint 全通过                                                    | 无                  | 已完成 |
| FP-02 | CSS 原生高级动效体系         | Card/SectionCard 使用 @container；主题切换与 AI 聊天用 View Transitions；全站 Scroll-Driven 渐入；Anchor Positioning 用于 tooltip/下拉；OKLCH 颜色体系迁移；视觉截图通过   | FP-01               | 已完成 |
| FP-03 | 生成式 AI 助手               | chatService 支持结构化输出；新增 UI 组件注册表（ProjectCard/SkillRadar/Timeline/ContactForm）；AIChat 根据消息渲染组件；本地模式返回结构化数据；deepseek-v4 only；测试通过 | FP-01               | 已完成 |
| FP-04 | WebGPU 3D 技能星系           | 引入 three + R3F；WebGPURenderer + TSL 着色器；Hero/技能区 3D 星座；集成 deviceCapabilities 画质分级；WebGL2/CSS 优雅降级；build/test 通过；视觉效果截图通过               | FP-01, FP-02        | 已完成 |
| FP-05 | 全站整合与视觉验证           | 端到端 Playwright 前台测试覆盖 12+ 测试点；桌面/移动端、深浅主题截图；性能指标无回归；所有测试通过                                                                         | FP-02, FP-03, FP-04 | 已完成 |
| FP-06 | GitHub 提交                  | 使用 总控制台.py 提交并推送；远程仓库状态正常                                                                                                                              | FP-05               | 已完成 |

## 已完成（仅保留一行摘要）

- FP-01 已完成：启用 React Compiler、AIChat 乐观更新、Speculation Rules 预渲染、相关测试通过。
- FP-02 已完成：Container Queries、View Transitions、Scroll-Driven 渐入、Anchor Positioning tooltip、OKLCH 颜色迁移全部落地，lint/typecheck/test/build 通过。
- FP-03 已完成：chatService 结构化 JSON 输出、本地 RAG 返回组件、UI 组件注册表（ProjectCard/SkillRadar/Timeline/ContactForm）、AIChat 动态渲染、deepseek-v4 only；已完成三轴审查并修复 Timeline 默认 scope 标题与内容不一致问题；FP-03 测试 50/50 通过。
- FP-04 已完成：R3F Canvas + WebGPURenderer/WebGLRenderer 降级 + 星系场景落地，deviceCapabilities 画质分级集成；清理未使用的 SkillConstellation 死代码并修正 HeroSection 测试 mock，lint/typecheck/test/build 全通过。
- FP-05 已完成：Playwright 前台视觉验证覆盖 13 个测试点、4 种视口/主题组合共 62 项检查、46 张截图；lint/typecheck/test/build 全通过；.gitignore 已忽略视觉验证过程截图目录。
- FP-06 已完成：通过 总控制台.py 将变更提交并推送到 GitHub（XuanRuiMuResume/main），远程仓库状态正常。

## 当前决策

- WebGPU 以最终效果优先，性能分级兜底
- LLM 仅使用 deepseek-v4
- CSS 新特性按渐进增强处理，一切以视觉效果为目标
- 后台已运行 dev server（port 5180）与 preview server（port 4173），子代理按需使用或重启
