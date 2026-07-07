# 玄锐暮个人简历（XuanRuiMuResume）项目规则

本项目同时遵守上级工作区的 [../AGENTS.md](../AGENTS.md) 通用规则。本文件只补充本项目特有的强制规则。

## 项目定位

- 基于 React + Vite + Three.js / React Three Fiber 的 3D 在线个人简历网站
- 风格：全功能星际档案馆（Full-Featured Interstellar Archive）
- 用户：玄锐暮（XuanRuiMu）

## GitHub 备份规则 [P0]

- 每次完成代码修改并验证通过后，必须立即上传到 GitHub 备份。
- 仓库地址：https://github.com/XuanRuiMu/XuanRuiMuResume
- 默认分支：main
- 提交信息使用中文描述本次改动。
- 可通过总控制台「Git 推送」菜单或本地 `git push origin main` 执行。
- 上传前清理临时文件、构建产物、测试截图等非必要文件，保持仓库只含源码、资源与文档。

## 项目结构约定

- `src/`：源码，包含组件、数据、状态、工具
- `public/models/`：3D 模型资源，须附 `MODEL_LICENSES.json`
- `dist/`、`node_modules/`、`.visual-verification/`、`.analysis/`：禁止提交，已写入 `.gitignore`
- 文档：`README.md`、需求文档、个人基本信息、技能总结

## 代码规范

- 变量/方法/类名优先中文；中文不可能时用 camelCase 拼音
- 用户可见文本走翻译/配置文件，禁止硬编码
- 每次修改后执行 `npm run lint` 与 `npm run build`，通过后再提交
- 3D 资源变更后需重新验证浏览器控制台无红色错误

## 交付规则

- 任务完成后使用 AskUserQuestion 报告：完成内容、验证结果、遗留问题、置信度、下一步建议
- 禁止自行假设下一步，必须获得用户确认
