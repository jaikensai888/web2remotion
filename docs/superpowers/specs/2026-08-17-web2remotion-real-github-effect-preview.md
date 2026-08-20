# Web2Remotion 真实 GitHub 特效预览

## Goal

阶段一的每个 effect 不再使用手绘网页作为画面源，而是使用 Playwright 录制的真实 GitHub 仓库页面，再由 Remotion 对真实视频做一个独立效果渲染。

默认输入：

- URL：`https://github.com/remotion-dev/remotion`
- README 标题：`Get started`
- 可用 README 视口：1 屏（由页面实际高度测量，不能伪造更多屏）
- 录制视口：1920×1080，30fps，约 8.4 秒，无音频
- GIF 输出：640×360，15fps，约 8 秒，无限循环

## Data flow

`GITHUB_URL/README_HEADING/SCREEN_COUNT` → Playwright → `source/capture/github-page.mp4` + `capture-meta.json` → Remotion `OffthreadVideo` → one effect GIF at a time.

每个目录项包含 `githubInstruction` 和 `sourceRequirement`。`captured-page` 和 `captured-page-overlay` 可以用单条真实 GitHub 视频生成；`requires-extra-input` 缺少真实 webcam、DOM 区域或其他输入时跳过，不生成假素材。

## Verification

- capture manifest 记录真实 URL、标题、视口、滚动锚点和时间线。
- 输入 MP4 用 `ffprobe` 检查 H.264、1920×1080、30fps、8.4 秒，并用 FFmpeg 完整解码。
- 每个 GIF 用 `ffprobe` 检查 640×360、15fps、约 8 秒、120 帧，并用 FFmpeg 完整解码。
- 抽帧确认画面中存在真实 GitHub 仓库 chrome、文件列表、About 侧栏和 README 目标内容。
