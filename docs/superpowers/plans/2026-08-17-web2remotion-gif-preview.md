# web2remotion GIF 预览实现计划

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** 为 15 个效果生成可直接播放的 GIF，并把预览页从 SVG 主展示改成 GIF 主展示。

**Architecture:** 参数化 Remotion composition + 本地 SVG 场景 + Remotion PNG 帧渲染 + FFmpeg GIF 编码；不接入 GitHub 录制和整体成片时间线。

**Tech Stack:** Node.js ESM、React 19、Remotion 4、`@remotion/bundler`、`@remotion/renderer`、FFmpeg/ffprobe、Node `node:test`。

**Spec:** `docs/superpowers/specs/2026-08-17-web2remotion-gif-preview-design.md`

## Global Constraints

- 输出只有 GIF：每个 effect 一个 640×360、3 秒、15fps 循环 GIF。
- 15 个 effect ID 必须保持不变。
- GIF 是主要验收物，SVG 只保留为源图/备用示意。
- 不实现 GitHub 页面录制、telemetry、时间线执行器或最终成片逻辑。

## Tasks

1. 建立 GIF 输出契约测试和 Remotion 依赖脚本。
2. 实现 `EffectPreview` composition 和 15 种 effect 的时间动画映射。
3. 实现本地 SVG 同步、Remotion 帧渲染和 FFmpeg GIF 编码。
4. 更新预览页、README、AGENTS 和 `.gitignore`，加入 GIF 产物说明。
5. 渲染全部 GIF，运行 ffprobe/FFmpeg 验证和 Node 测试，并同步目标项目。
