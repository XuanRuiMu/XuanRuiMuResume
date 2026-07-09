# 循环工程：简历网站测试缺口补充

## 元信息

- 项目：`xuanruimu-resume`（个人简历）
- 启动时间：2026-07-09
- 当前阶段：阶段3自主循环
- 总循环上限：6 轮（2 个功能点 × 3）
- 单问题修复上限：5 次
- 当前循环次数：1

## 目标

补充 FP-05 三轴审查中识别的测试缺口，提升前端全量测试的防御深度，确保异常路径、视觉回归、控制台错误均有覆盖。

## 停止条件（必须全部满足）

1. 所有功能点状态为 `已完成` 或 `已跳过`
2. `npm run lint` 零报错
3. `npm run typecheck` 通过
4. `npm run test` 全部通过（含新增测试）
5. `npm run build` 成功
6. 新增测试覆盖以下缺口：控制台错误断言、网络异常降级、截图像素级对比、WebGPU 不支持路径 E2E
7. 代码通过 总控制台.py 提交到 GitHub
8. 过程性文件清理完毕

## 范围边界

### 做什么

- Playwright E2E 测试中增加控制台错误断言（error/warning 不允许出现未处理异常）
- AI 聊天服务增加网络异常降级测试（LLM 接口 5xx/4xx/超时）
- 视觉验证增加截图像素级对比（基线截图比对，检测回归）
- WebGPU 不支持路径的 E2E 覆盖（模拟 `navigator.gpu` 缺失，验证降级到 WebGL2/CSS）

### 不做什么

- 不改业务数据层
- 不改 UI 主题色
- 不新增 LLM 提供商
- 不做性能优化之外的视觉改动

### 禁止触碰

- `src/data/personalInfo.ts` 个人隐私信息
- 总控制台.py（仅调用，不修改）

## 待处理功能点

| ID    | 描述               | 验收标准                                                                                                               | 依赖         | 状态   |
| ----- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------ | ------ |
| FP-T1 | E2E 与异常路径测试 | Playwright 增加控制台错误断言、网络异常降级、WebGPU 不支持路径 E2E；测试通过；lint/typecheck/build 通过                | 无           | 进行中 |
| FP-T2 | 视觉回归基线对比   | 生成深色/浅色、桌面/移动端基线截图；Playwright 测试进行像素级对比；差异阈值可配置；测试通过；lint/typecheck/build 通过 | 无           | 进行中 |
| FP-T3 | GitHub 提交与清理  | 使用 总控制台.py 提交并推送；远程仓库状态正常；删除本技能创建的过程性文件                                              | FP-T1, FP-T2 | 待开始 |

## 已完成（仅保留一行摘要）

- 无

## 当前决策

- 2026-07-09 23:15 发现：GitHub CI 在 commit 4bb6ae8 处 Format check 失败；本地复现后定位到 package.json 被错误删除了 @react-three/*、three、@babel/core、@rolldown/plugin-babel、babel-plugin-react-compiler 等关键依赖。已恢复并运行 npm install，全量 lint/typecheck/test/build 已通过。
- 测试缺口按 E2E 异常路径、视觉回归两个独立功能点并行处理
- 基线截图提交到仓库 `tests/e2e/baseline-screenshots/`，便于 CI 复用
- WebGPU 不支持路径通过 Playwright `page.evaluate` 删除 `navigator.gpu` 模拟
