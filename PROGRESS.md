# 循环工程进度追踪：星系星空背景精简并应用到主页

## 元信息

| 字段     | 值                   |
| -------- | -------------------- |
| 任务     | 精简特效并应用到主页 |
| 状态     | 已完成               |
| 循环计数 | 3                    |

## 目标

S2-effects.html 仅保留 5 个特效（颜色呼吸+超新星+星云+星星闪烁+尘埃粒子），删除其他 6 个特效；设置用户指定默认参数；将该背景+控制面板+默认参数移植为主页背景替换 A25，删除旧代码，验证并推送 GitHub。

## 停止条件（必须可机器验证）

- [x] 条件1：S2-effects.html 仅含保留特效，默认参数为 超新星0.5 / 星云6·0.5 / 闪烁0.6·1.85 / 尘埃1（代码核验 S2-effects.html:244-247 与 StarryGalaxyScene.ts:17-20 双端一致）
- [x] 条件2：主页新背景组件挂载 lil-gui 面板（特效控制面板 + 星系参数/颜色呼吸/超新星/星云/星星闪烁/尘埃粒子 6 个文件夹），默认参数同上（浏览器实测 .lil-gui.root=1、文件夹=6、已 append 到 document.body）
- [x] 条件3：A25 旧代码（A25StarryBackground/A25StarryScene/StarryBackgroundControls/StarryBackgroundContext）已删除，无残留引用
- [x] 条件4：vitest 全量通过、tsc 零错误、lint 零报错、build 成功（LINT=0 / TSC=0 / VITEST=376·376 / BUILD=0）
- [x] 条件5：浏览器实测主页与测试页均无红色错误，特效可见（TOTAL_ERRORS=0、TOTAL_FAILED_REQUESTS=0；主页 WebGL 星空 canvas 存在 + 水墨揭透明像素证明底层星空可见；测试页 WebGL 可见）
- [x] 条件6：GitHub 已推送（main 分支）— `git push git@github.com:XuanRuiMu/XuanRuiMuResume.git main` 成功，`46d1d5c..5e7bb58 main -> main`，远端 `refs/heads/main = 5e7bb589`（与本地一致）

## 熔断上限

| 类型           | 上限 | 当前 | 状态 |
| -------------- | ---- | ---- | ---- |
| 总循环次数     | 18   | 3    | 正常 |
| 单问题修复次数 | 5    | 0    | 正常 |

## 范围边界

### 做什么

- FP-01 精简测试页 S2-effects.html
- FP-02 新建 StarryGalaxyScene.ts（three 0.185 移植场景）
- FP-03 新建 StarryGalaxyBackground.tsx
- FP-04 删除 A25 旧代码并更新引用
- FP-05 全量验证+浏览器实测
- FP-06 GitHub 推送

### 不做什么（防过度烘焙）

- 不新增特效；不改变保留特效的视觉实现逻辑（仅删代码+改默认值）
- 不新增 npm 依赖（lil-gui 走 three/addons）
- 不改 observability 模块 / main.tsx / providers
- 测试页保持 three 0.136 CDN 与 OrbitControls 不变
- 水墨揭示保留（InkRevealRenderer 逻辑不动）

### 禁止触碰

- `src/observability/**`
- `src/components/ai-chat/**`、`src/components/command-palette/**`
- `public/test-starry/index.html`

## 待处理功能点

| ID    | 描述                | 验收标准                                     | 依赖  | 状态   | 循环 |
| ----- | ------------------- | -------------------------------------------- | ----- | ------ | ---- |
| FP-05 | 全量验证+浏览器实测 | lint/tsc/vitest/build 全过；双页面无红色错误 | FP-04 | 已完成 | 3    |
| FP-06 | GitHub 推送         | main 分支已推送，工作区干净                  | FP-05 | 已完成 | 3    |

### 状态说明

- **待开始**：尚未派发子代理
- **进行中**：子代理正在执行
- **已阻塞**：子代理无法解决
- **已跳过**：因依赖阻塞或熔断跳过

## 已完成（仅保留一行摘要）

- FP-01 已完成：S2-effects.html 精简为 576 行，仅 5 特效+默认参数，浏览器实测 0 错误
- FP-02 已完成：StarryGalaxyScene.ts 移植完成（GLSL3/lil-gui/BigBang），测试 6/6 全量 370/370 通过
- FP-03 已完成：StarryGalaxyBackground.tsx 全屏挂载+降级模式，测试 18/18 全量 376/376 通过
- FP-04 已完成：A25 旧代码 4 文件删除，layout/测试/翻译已更新，grep 零残留，全量验证通过

## 当前决策

| 时间  | 决策                                                                      | 影响范围    |
| ----- | ------------------------------------------------------------------------- | ----------- |
| 阶段1 | 颜色呼吸保留（用户确认）；主页替换 A25 并删除旧代码（用户确认）           | 全功能点    |
| 阶段1 | lil-gui 直接移植主页（from three/addons，零新依赖），右下角定位           | FP-02/FP-03 |
| 阶段1 | BigBang 动画手写 cubicInOut easing，替代 TWEEN（主页无此依赖）            | FP-02       |
| 阶段1 | shader 改写为 GLSL3 语法+glslVersion（three 0.185 无 GLSL1 自动转换保障） | FP-02       |
| 阶段1 | 默认参数：超新星0.5；星云6/0.5；闪烁0.6/1.85；尘埃1（用户指定）           | FP-01/FP-02 |

## 阻塞与遗留问题

| ID  | 问题描述                                                                                                                                                                                                                                                                                                                                                                                        | 建议处理方式 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| B1  | 本地提交 5e7bb58 已完成；原 `git push origin main`（HTTPS）失败：端点 `Recv failure: Connection was reset`。已改为 SSH 路径：生成 ed25519 密钥并由用户登记到 GitHub，复验 `ssh -T git@github.com` 返回 `Hi XuanRuiMu! ...` 鉴权通过，推送 `git push git@github.com:XuanRuiMu/XuanRuiMuResume.git main` 成功（`46d1d5c..5e7bb58 main -> main`，远端 `refs/heads/main = 5e7bb589`）。**已解决。** | —            |

## 收尾验证结论（FP-05）

- 修复：StarryGalaxyScene.ts 6 个 shader 手写 `#version 300 es` 与 `glslVersion: THREE.GLSL3`（three 自动前置）冲突导致重复指令编译失败；已移除手写 `#version`，主页 console.error 由 2 降至 0。
- 修复：vite.config.js 增加 `optimizeDeps.entries: ['index.html']`，消除对 `public/test-starry/S2-effects.html`（CDN importmap）的误扫描警告。
- 浏览器实测（Playwright + swiftshader）：主页与测试页 `TOTAL_ERRORS=0`、失败请求 0；主页星空 WebGL canvas 存在，水墨揭示揭出 4107 透明采样像素（证明底层星空可见）；测试页 WebGL 可见；主页 lil-gui 面板 root=1/文件夹=6/已挂载 body。
- 全量校验：LINT=0、TSC=0、VITEST=376/376、BUILD=0（PWA sw.js 生成）。
- 遗留：PROGRESS.md 按循环工程惯例为过程性文件，推送后本地清理（不入库）；条件1–6 全部满足，任务闭环。

## 后续修复（用户实测反馈，2026-07-31）

- **问题**：主页层序错误——水墨遮罩（z-1，挂 document.body）盖住了被锁在星空 z-0 层叠上下文内的全部主页内容，表现为"第一层水墨、第二层内容"。
- **根因**：`layout.tsx` 把 header/main/footer 等全部内容包进了 `StarryGalaxyBackground`（`fixed inset-0 z-0`）div，该 div 的 `z-0` 形成层叠上下文，把内部内容整体锁在 z-0 层，无法高出水墨 z-1。
- **修复**：内容移出星空 div，改为与星空/水墨同级；用 `relative z-10` 内容容器包裹，层序固定为 **星空(z0) < 水墨(z1) < 内容(z10+)**。星空组件保持纯背景层（z-0），水墨挂 body（z-1），内容恒显于水墨之上，鼠标擦除水墨透出底层星空。
- **验证**：Playwright 接管命中测试确认 header 坐标 (640,29) 顶层为内容(SPAN)而非水墨；starry/ink/content z-index 分别为 0/1/10；consoleErrors=0。tsc=0 / lint(src)=0 / vitest 376·376=0 全过。
- **提交**：`src/app/layout.tsx` 已提交并推送 main（SSH）。

## 后续修复二（用户实测反馈，2026-07-31）

- **背景未居中/溢出**：根因 `StarryGalaxyScene.ts` 相机 `camera.position.set(0,2,3)` 且从未 `lookAt` 原点，星系圆盘（XZ 平面、半径随 BigBang 增至 2.79）被"侧面平视"，近侧盘缘逼近相机 → 偏下且溢出。
- **修复 A（居中）**：相机改 `position.set(0,2.2,5.5)` + `camera.lookAt(0,0,0)`，星系中心投影到屏幕正中；渲染器加 `preserveDrawingBuffer:true` 支持快照。
- **修复 B（面板入顶栏+滚动）**：lil-gui 由挂 `document.body` 改为挂 header 的 `#starry-gui-slot`，`fixed; top:64px; right:12px; maxHeight:calc(100vh-80px); overflowY:auto` → 锚定顶栏右下、可滚动（6+ 文件夹不溢出）。
- **修复 C（关闭水墨开关）**：新增 `src/store/useStarryUiStore`（zustand，已是依赖）桥接 GUI 开关 → `InkRevealOverlay` 的 `enabled`；面板新增"显示"文件夹 + "水墨遮罩"开关（文案走 `zh-CN.json` 的 `starryBg.display`/`starryBg.inkScreen`）。
- **验证**：Playwright 像素级——中央 ROI 质心 roiCx=0.525/roiCy=0.501（居中）；面板 `position:fixed;top:64px;overflowY:auto;maxHeight:720px;zIndex:1000`；水墨初始 opaqueRatio=1、关闭后=0（toggle=PASS）；consoleErrors=0。tsc=0/lint(src)=0/vitest 376·376=0 全过。
- **提交**：`0064e31` 已提交并推送 main（SSH），含 StarryGalaxyScene.ts / InkRevealOverlay.tsx / layout.tsx / useStarryUiStore.ts / zh-CN.json 共 5 文件。

## 后续修复三（用户实测反馈，2026-08-01）

- **问题 A（面板未真正入顶栏）**：上一轮面板为 `fixed; top:64px; right:12px`，仍是悬浮于顶栏之下的独立浮层，不符合"和其他元素一样在顶栏上"的要求。
- **问题 B（开场动画）**：用户要求删除星空背景 BigBang 开场动画。
- **修复 A（面板入顶栏）**：`layout.tsx` 顶栏右侧 `ThemeToggle` 旁新增 `#starry-gui-root`（relative）容器，内含触发按钮 `#starry-gui-trigger`（lucide `SlidersHorizontal`，尺寸/配色对齐顶栏其它按钮）与下拉槽 `#starry-gui-slot`（absolute right-0 top-full z-[1000] hidden w-[300px]）；`StarryGalaxyScene.ts` 的 lil-gui 挂载进该槽，去掉 `position:fixed/top/right` 强制改为 `position:relative; width:100%; maxHeight:calc(100vh-80px); overflowY:auto`；新增 document 级点击委托：点触发按钮切换槽 `hidden`、点面板外区域收起；`destroy` 中 `removeEventListener`。触发按钮文案/aria 走新翻译键 `starryBg.panelTrigger`（`zh-CN.json` 新增）。
- **修复 B（删除开场动画）**：移除 `BIG_BANG_DURATION`、`cubicInOut`、`bigBangStart/bigBangDone` 及动画循环内逐帧增长逻辑；星系 uniforms 直接置终值 `uRadius=2.79 / uSpin=1.75 / uRandomness=1`，渲染即完整成形；移除 `gui.open()` 触发与未用 `radiusSlider/spinSlider/randomnessSlider` 变量。`fGalaxy` 与 `fDisplay` 默认展开，关面板后不残留浮层。
- **验证**：Playwright 双环境——dev(5180) 关闭 DevOverlay(Ctrl+Shift+D) 后 9/9 通过；prod preview(4173) 7/7 通过。结论：触发按钮恒在顶栏、面板默认隐藏非悬浮、点击展开/收起、lil-gui 挂载于顶栏容器内、含"水墨遮罩"开关、星空 canvas 渲染、无 console 错误。tsc=0 / lint(src)=0（另有 8 条既存 warning，均与本次改动无关）/ vitest 376·376=0 / build=0。
- **已知 caveat（已解决）**：dev 模式项目自带 observability `DevOverlay`（top-right 420px、z-99999）曾遮挡顶栏右侧触发按钮；后续修复四已将触发按钮移至顶栏左侧（NavDock 旁），dev/prod 均直接可点，无需关闭浮层。该浮层为 dev-only（`isDev()` 守卫，生产构建不渲染）。
- **Docker**：项目不含 Dockerfile / docker-compose / .dockerignore，未使用 Docker，未启动。
- **提交**：`c6feebd` 已本地提交，并随后续修复四一并推送 main（SSH）。

## 后续修复四（用户选择，2026-08-01）

- **问题**：dev 模式项目自带 observability `DevOverlay`（top-right、420px、`z-index:99999`）遮挡顶栏右侧触发按钮，dev 点击前需先关闭浮层。
- **修复**：`layout.tsx` 将 `#starry-gui-root`（触发按钮+下拉槽）从顶栏右侧 `ThemeToggle` 旁移至左侧 `NavDock` 旁，与 `ThemeToggle` 分离；下拉槽锚点由 `right-0` 改为 `left-0`（左锚定避免溢出屏幕左缘）；`ThemeToggle` 仍居右。触发按钮仍"在顶栏上与其他元素并列"，且避开了 DevOverlay 覆盖区。
- **验证**：Playwright(dev 5180) 直接点击触发按钮（不关闭 DevOverlay）6/6 通过：触发按钮 centerX=721 < DevOverlay 左缘 844（1280 视口）；直接点击即展开面板；lil-gui 挂载于顶栏容器内；含"水墨遮罩"开关；下拉面板在屏幕内；无 console 错误。tsc=0 / lint=0 错误 / vitest 376·376=0。
- **提交**：已本地提交 `f85b876`（含左移改动与 PROGRESS 更新），并推送 main（SSH）：`0064e31..f85b876 main -> main`，远端 `refs/heads/main = f85b876d9e859c27699b750f7087ebdfd28c55e6`（与本地一致）。
