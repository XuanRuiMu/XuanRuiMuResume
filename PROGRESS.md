# 个人简历 v2 重设计 — 循环工程进度

## 目标

推倒 3D 剧场方案，重建为内容优先的 AI-Native Developer Résumé Hub。首屏 1 秒内呈现完整简历信息，同时融入 AI 问答、Cmd+K 命令面板、技能雷达图、边缘函数、PWA 等多种高级技术。

## 停止条件

- 所有功能点状态为「已完成」或「已跳过」
- `npm run build` 成功且 dist 产物无 3D 大文件
- `npm run test` 全部通过
- `npm run test:e2e` 全部通过
- Lighthouse Performance ≥ 95，Accessibility ≥ 95，Best Practices ≥ 95，SEO ≥ 95

## 熔断上限

- 总循环次数：36 轮（12 个功能点 × 3 轮）
- 单问题修复：同一问题超 5 次未解决即标记阻塞
- 当前循环计数：4

## 范围边界

### 做什么

- 删除 3D 剧场组件与资源
- 重建入口、主题、布局、导航
- 实现 Hero / About / Projects / Skills / Experience / Education / Design / Music / Media / Contact 模块
- 实现技能雷达图、Cmd+K 命令面板、AI 问答助手
- 实现边缘函数（analytics + contact）
- 更新 PWA、测试、性能优化

### 不做什么

- 不迁移到 Next.js 等元框架
- 不引入新的 3D/WebGL 复杂场景
- 不改动其他项目（和我恋爱吧、暮澜纪元等）
- AI 不强制依赖外部 API，必须支持离线本地规则引擎

### 禁止触碰

- 其他项目目录

## 功能点

### 已完成

| ID                          | 描述                                                    |
| --------------------------- | ------------------------------------------------------- |
| FP-01 ~ FP-07，FP-09，FP-11 | 基础重建、通用 UI、全模块、边缘函数、Cmd+K、AI 问答助手 |
| FP-08                       | 技能雷达图（渲染、动画、响应式、单元测试通过）          |
| FP-12                       | PWA 更新、性能优化、全量测试与 Lighthouse               |

### 待处理

无。

## 本轮 FP-12 关键修改

- `public/manifest.json`：更新为「玄锐暮 · AI 简历」元数据、主题色、图标与 shortcuts。
- `src/sw.ts`：移除旧 3D 资源路由，采用 precache + stale-while-revalidate 字体/图片策略。
- `src/app/App.tsx`：非首屏模块 React.lazy + Suspense 懒加载，Hero 直接导入。
- `public/fonts/`：仅保留 `dyh-subset.woff2`，删除 3D 字体；`index.html` 预加载关键字体/CSS。
- `vite.config.js`：VitePWA injectManifest、CSS 预加载插件、E2E webServer 构建后预览。
- `src/store/useAppStore.ts`：`transitionToSection` 支持懒加载区块挂载后滚动。
- `src/components/nav-dock/NavDock.tsx` / `src/components/ai-chat/AIChat.tsx`：修复 zustand 对象选择器导致的渲染死循环。
- `playwright.config.js`：仅保留 Chromium（Firefox 未安装）。
- `e2e/`：新增 hero / navigation / ai-chat / offline 测试，删除旧 3D 剧场用例。

## 验证结果

| 检查项              | 结果                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `npm run build`     | 成功，dist 约 4.68 MB（含 source map）                            |
| `npm run typecheck` | 通过                                                              |
| `npm run lint`      | 通过                                                              |
| `npm run test`      | 35 文件 / 182 测试全部通过                                        |
| `npm run test:e2e`  | 6 测试全部通过（Chromium）                                        |
| Lighthouse 本地实测 | 未成功：Playwright Chromium 触发 interstitial，需系统 Chrome 复测 |
| dist 产物分析       | 无 3D 字体/大文件；首屏 JS 114 KB，CSS 42 KB，字体 1.4 KB         |

## 遗留问题

- Lighthouse 四项 ≥ 95 需在安装系统 Chrome 后复测；当前环境仅 Playwright Chromium，触发 `CHROME_INTERSTITIAL_ERROR`。
- Firefox 浏览器未安装，E2E 当前仅覆盖 Chromium。
