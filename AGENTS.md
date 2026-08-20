# AGENTS.md

## Project status

本项目处于阶段一：真实 GitHub 页面录制、可播放 GIF 特效预览和 Prompt → 剪辑表格确认流程。不要在未得到用户确认前加入整体成片时间轴、通用 telemetry、新的多媒体输入模型或最终成片执行。阶段一允许为单个效果录制真实页面并生成 GIF。

## Architecture

- `effect-catalog/effects.json` 是效果源数据。
- `effect-catalog/svgs/`、`prompt-map.md`、`preview.html` 由 `scripts/build-effect-catalog.mjs` 生成；`renders/effects/` 由 Remotion + FFmpeg 生成。
- `source/capture/github-page.mp4` 和 `capture-meta.json` 由 `scripts/capture-github-real.mjs` 生成。
- `.codex/skills/web2remotion/SKILL.md` 规定自然语言解析、剪辑表格和确认门禁。
- `tests/` 使用 Node 内置 `node:test` 校验效果 ID、字段、SVG、GIF 计划和生成资产。

## Commands

- `npm run catalog:build`
- `npm run catalog:validate`
- `npm run capture:github`
- `npm run effects:render`
- `npm run effects:verify`
- `npm test`

修改效果目录后先重新 build；修改真实输入后先运行 capture，再运行 validate、effects:render、effects:verify 和 test。

## Constraints

- 所有 SVG 必须内联绘制，不引用远程图片或字体资源。
- 每个效果必须有唯一 `id`、Prompt 示例、默认参数、未来 Remotion 参数形状和同名 SVG。
- 真实网页必须来自 Playwright 录制并由 `OffthreadVideo` 读取；不得用手绘网页替代缺失素材。
- `requires-extra-input` 的效果必须在缺少 webcam、DOM 区域或其他真实输入时跳过，不生成假 GIF。
- 阶段一不使用 PixiJS/Canvas 作为运行时，也不改变现有 `github-remotion` 的整体成片录制契约。
