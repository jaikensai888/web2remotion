# web2remotion 真实 GitHub 特效预览计划

## Goal

用真实 GitHub 页面素材逐个生成 effect GIF，保留阶段一的效果确认门禁，不实现最终整体成片时间轴。

## Tasks

- [x] 为每个 effect 增加真实 GitHub 指令和素材要求。
- [x] 实现动态 URL、README 标题和 screen count 的 Playwright 录制与 manifest。
- [x] 将 Remotion composition 改为 `OffthreadVideo` 真实 MP4 层。
- [x] 逐个生成单条真实素材支持的 GIF。
- [x] 对输入 MP4 和 GIF 运行 ffprobe/FFmpeg 解码验证。
- [ ] 用户确认这些真实效果后，再实现整体剪辑表执行和最终成片。

## Current result

当前默认录制为 `remotion-dev/remotion` 的 `Get started`，页面只提供 1 个可用 README 视口；生成 13 个 GIF，`webcam-bubble` 和 `dynamic-block-reveal` 因缺少额外真实输入而跳过。
