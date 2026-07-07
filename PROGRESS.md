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

- 循环计数器：1
- 已完成：1/12
- 进行中：FP-02
- 待开始：FP-03 ~ FP-12

## 待处理功能点

| ID | 描述 | 验收标准 | 依赖 | 状态 |
|----|------|----------|------|------|
| FP-01 | WebGPU 渲染器 + TSL 基础 + WebGL 优雅降级 | `npm run dev` 启动无错；Canvas 正常渲染；不支持 WebGPU 时自动回退 WebGL | - | 已完成 |
| FP-02 | 高级程序化星云背景（自定义 GLSL/TSL） | 背景具备多层噪声星云、尘埃带、色彩渐变；帧率稳定 | FP-01 | 待开始 |
| FP-03 | 3D 折射玻璃文字标题（Text3D + MeshTransmissionMaterial） | 姓名/职称以 3D 玻璃质感呈现；带环境反射与折射 | FP-01 | 待开始 |
| FP-04 | 全息/虹彩实体材质升级 | 五个主题实体在 hover/激活时呈现全息、虹彩或薄膜干涉效果 | FP-01 | 待开始 |
| FP-05 | 高级后期处理栈 | 组合 Bloom、DepthOfField、ChromaticAberration、Vignette、Noise、ToneMapping | FP-01 | 待开始 |
| FP-06 | 弹簧阻尼相机 + 鼠标视差 | 相机移动带 spring-damp；鼠标移动产生平滑视差；点击实体流畅推进 | - | 待开始 |
| FP-07 | GSAP ScrollTrigger + Lenis 平滑滚动 | 页面存在可滚动内容区；滚动驱动 3D 相机/元素动画；Lenis 提供丝滑滚动 | FP-06 | 待开始 |
| FP-08 | GPU Instanced 粒子场 | 使用 InstancedMesh/Points 实现万级粒子；性能 60fps | FP-01 | 待开始 |
| FP-09 | 环境 HDR 反射 | 加载 HDR/EXR 环境贴图；玻璃/金属材质出现真实反射 | FP-01 | 待开始 |
| FP-10 | 体积光/上帝光束 | 在实体周围实现锥形体积光或光柱效果 | FP-01 | 待开始 |
| FP-11 | 内容框架与 roughly 填充 | 各板块有占位内容；文字走翻译/数据文件；整体叙事完整 | FP-03, FP-07 | 待开始 |
| FP-12 | 最终构建验证与清理 | `npm run build` 零报错；无冗余文件；PROGRESS.md 待清理 | FP-01~FP-11 | 待开始 |

## 已完成（仅保留一行摘要）

- FP-01：Theater.jsx 已接入 WebGPURenderer 异步创建，失败自动回退 WebGLRenderer；`npm run build` 通过。当前场景中的 ShaderMaterial 与 WebGPU 不兼容，待 FP-02/FP-03 迁移为 TSL/NodeMaterial。

## 当前决策

- 保持现有 React + Vite + R3F 架构，重点升级视觉与交互
- WebGPU 优先，失败则优雅降级 WebGL，确保可用性
- 内容先以 roughly 占位填充，保证叙事框架完整
