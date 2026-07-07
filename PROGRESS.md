# 玄锐暮个人简历视觉升级 — 循环工程进度

## 元信息

- 项目：玄锐暮个人简历（XuanRuiMuResume）
- 目标：基于 2026 最前沿 WebGL/WebGPU 技术，打造具备顶级视觉冲击力的 3D 在线简历
- 停止条件：所有功能点完成/跳过/阻塞，构建零报错，开发服务器正常运行，页面可访问
- 熔断上限：总循环 36 轮；单问题修复 5 次
- 范围边界：
  - 做什么：升级渲染管线、背景、材质、后期、相机、交互、粒子、内容框架
  - 不做什么：不替换整体 React/Vite/Tailwind 架构，不接入后端，不迁移到 Next.js
  - 禁止触碰：上级工作区 AGENTS.md、总控制台、其他项目目录

## 当前状态

- 循环计数器：7
- 已完成：8/12
- 进行中：无
- 待开始：FP-10 ~ FP-12

## 待处理功能点

| ID | 描述 | 验收标准 | 依赖 | 状态 |
|----|------|----------|------|------|
| FP-01 | WebGPU 渲染器 + TSL 基础 + WebGL 优雅降级 | `npm run dev` 启动无错；Canvas 正常渲染；不支持 WebGPU 时自动回退 WebGL | - | 已完成 |
| FP-02 | 高级程序化星云背景（自定义 GLSL/TSL） | 背景具备多层噪声星云、尘埃带、色彩渐变；帧率稳定 | FP-01 | 已完成 |
| FP-03 | 3D 折射玻璃标题（Text3D + MeshTransmissionMaterial） | 姓名/职称以 3D 玻璃质感呈现；带环境反射与折射 | FP-01 | 已完成 |
| FP-04 | 全息/虹彩实体材质升级 | 五个主题实体在 hover/激活时呈现全息、虹彩或薄膜干涉效果 | FP-01 | 已完成 |
| FP-05 | 高级后期处理栈 | 组合 Bloom、DepthOfField、ChromaticAberration、Vignette、Noise、ToneMapping | FP-01 | 已完成 |
| FP-06 | 弹簧阻尼相机 + 鼠标视差 | 相机移动带 spring-damp；鼠标移动产生平滑视差；点击实体流畅推进 | - | 已完成 |
| FP-07 | GSAP ScrollTrigger + Lenis 平滑滚动 | 页面存在可滚动内容区；滚动驱动 3D 相机/元素动画；Lenis 提供丝滑滚动 | FP-06 | 已完成 |
| FP-08 | GPU Instanced 粒子场 | 使用 InstancedMesh/Points 实现万级粒子；性能 60fps | FP-01 | 已完成 |
| FP-09 | 环境 HDR 反射 | 加载 HDR/EXR 环境贴图；玻璃/金属材质出现真实反射 | FP-01 | 已完成 |
| FP-10 | 体积光/上帝光束 | 在实体周围实现锥形体积光或光柱效果 | FP-01 | 待开始 |
| FP-11 | 内容框架与 roughly 填充 | 各板块有占位内容；文字走翻译/数据文件；整体叙事完整 | FP-03, FP-07 | 待开始 |
| FP-12 | 最终构建验证与清理 | `npm run build` 零报错；无冗余文件；PROGRESS.md 待清理 | FP-01~FP-11 | 待开始 |

## 已完成（仅保留一行摘要）

- FP-01：Theater.jsx 已接入 WebGPURenderer 异步创建，失败自动回退 WebGLRenderer；`npm run build` 通过。
- FP-02：GalaxyBackground.jsx 已重写为 WebGPU（NodeMaterial + TSL）/ WebGL（ShaderMaterial）双路径，包含多层分形噪声星云、色彩渐变、尘埃带、星点闪烁与缓慢旋转； Theater.jsx 同步迁移 VolumetricCone 为双路径材质并增加 WebGPU adapter 预检，避免无效初始化报错。
- FP-03：新增 HeroText3D.jsx，使用本地 Helvetiker Bold JSON 字体渲染 "XUANRUIMU"；WebGL 路径使用 MeshTransmissionMaterial 实现折射/反射玻璃，WebGPU 路径降级为 MeshPhysicalMaterial；通过程序化 DataTexture 提供离线环境反射，并加入缓慢浮动/旋转动画；已集成到 Theater.jsx SceneContent。
- FP-04：新增 HolographicMaterial.jsx，WebGPU 路径基于 MeshPhysicalNodeMaterial + TSL 实现 fresnel 虹彩边缘光、扫描线与 hover 能量脉冲，WebGL 路径使用 MeshPhysicalMaterial 保持 iridescence/clearcoat/sheen 能力；EntityObject.jsx 五个实体核心几何体已替换为该材质并提升 hover 旋转速度/点光源强度；Playwright 截图验证剧场渲染无控制台报错。
- FP-05：新增 PostProcessingStack.jsx，WebGL 路径组合 Bloom（mipmapBlur + activeSection 动态强度）、DepthOfField（目标随 active/hover section 平滑插值）、ChromaticAberration（radialModulation + 动态偏移）、Vignette、Noise、ToneMapping（AGX）；WebGPU 路径通过 `gl.isWebGPURenderer` 检测跳过 EffectComposer；`npm run lint` 与 `npm run build` 通过，开发服务器正常启动。
- FP-06：重写 CameraController.jsx，使用手写 spring-damper 实现位置/注视点双弹簧阻尼；接入鼠标位置映射为 subtle 视差位移与 ±2° 旋转；无激活 section 时启用慢速自动巡航；`pointer: fine` 媒体查询保证触控设备安全降级；`npm run lint` 与 `npm run build` 通过。
- FP-07：安装 `@gsap/react` 与 `lenis`；新增 ScrollOverlay.jsx 集成 Lenis 平滑滚动与 GSAP ScrollTrigger（含 scrollerProxy）；在页面前景添加 6 屏可滚动 DOM 覆盖层与占位卡片；CameraController.jsx 根据 scrollProgress 以 spring-damper 驱动相机 subtle 弧线；EntityObject.jsx 与 HeroText3D.jsx 响应滚动实现旋转/缩放/发光/位移动画；点击实体进入详情的交互保留；`npm run lint` 与 `npm run build` 通过，开发服务器正常启动。
- FP-08：新增 InstancedParticles.jsx，使用 `THREE.InstancedMesh` + `InstancedBufferAttribute` 实现 20000 粒子；WebGL 路径基于 `ShaderMaterial` 自定义顶点/片段着色器，WebGPU 路径基于 `NodeMaterial` + TSL；每个粒子具备独立位置、缩放、相位、速度与蓝紫/暖金颜色混合；顶点阶段实现整体漂移、正弦浮动、鼠标/滚动交互； Theater.jsx 中以新组件替换 AmbientDust；`npm run lint` 与 `npm run build` 通过，开发服务器正常启动，Playwright 截图验证剧场渲染无控制台报错。
- FP-09：新增 EnvironmentProbe.jsx 与 `scripts/generate-hdr-env.js`，生成 512×256 程序化 `public/env/studio.hdr`（约 232 KB，峰值亮度 13）；WebGL/WebGPU 双路径通过 `HDRLoader` 加载并自动回退到 `FloatType` DataTexture；Theater.jsx 集成该组件统一设置 `scene.environment` 与深色背景；HeroText3D 与 EntityObject/HolographicMaterial 提升 `envMapIntensity` 与降低 roughness 以增强玻璃与金属反射；`npm run lint` 与 `npm run build` 通过，开发服务器启动无控制台报错。

## 当前决策

- 保持现有 React + Vite + R3F 架构，重点升级视觉与交互
- WebGPU 优先，失败则优雅降级 WebGL，确保可用性
- 内容先以 roughly 占位填充，保证叙事框架完整
