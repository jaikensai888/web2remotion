# Web2Remotion GIF 效果预览设计

## Goal

把阶段一的 15 个效果从静态 SVG 预览升级为可直接播放的 GIF。每个 effect ID 生成一个 3 秒、640×360、30fps 的 GIF；GIF 是阶段一的主要验收产物，SVG 继续作为源图和调试备用。

## Architecture

- `src/EffectPreview.jsx`：参数化 Remotion composition，根据 `effectId` 对本地 SVG 场景施加时间变化和覆盖层动画。
- `src/index.jsx`：注册 `EffectPreview` composition。
- `scripts/prepare-remotion-public.mjs`：将目录中的本地 SVG 同步到 Remotion `public/`，不引用远程资源。
- `scripts/render-effect-gifs.mjs`：一次 bundling，逐个 effect 用 Remotion 渲染 PNG 帧，再用 FFmpeg 生成 GIF。
- `scripts/verify-effect-gifs.mjs`：使用 ffprobe 检查每个 GIF 的尺寸、时长和帧率，并使用 FFmpeg 完整解码。
- `effect-catalog/preview.html`：优先展示 GIF 播放，保留 SVG 入口。

## Output contract

- 输出目录：`renders/effects/<effectId>.gif`。
- 画布：640×360。
- 时长：3 秒，Remotion 90 帧。
- GIF：15fps，循环播放，无音频。
- 每个 effect 只生成一个 GIF；不录制 GitHub 页面、不执行整体剪辑表、不生成最终成片。

## Global constraints

- 保留现有 15 个 effect ID、Prompt 对照表和确认门禁。
- Remotion 渲染依赖和缓存留在项目目录；不写入用户全局 npm 缓存或系统临时目录。
- 所有源素材为本地 SVG；不依赖外部 URL。
- GIF 产物必须经 `ffprobe` 和 FFmpeg 解码验证。
