# Web2Remotion Effect Catalog Reference

## Source of truth

项目根目录的 `effect-catalog/effects.json` 是唯一的机器可读源。`prompt-map.md` 和 `preview.html` 由 `node scripts/build-effect-catalog.mjs` 生成，不要手工创建未登记的 effect ID。

当前阶段包含 15 个效果：

- camera：`camera-zoom`、`camera-pan`、`punch-in`
- pointer：`cursor-smooth`、`cursor-sway`、`click-bounce`
- focus/annotation：`spotlight`、`annotation-callout`
- frame/background/overlay：`frame-rounded-shadow`、`background-gradient-blur`、`webcam-bubble`、`browser-device-frame`
- reveal：`dynamic-block-reveal`
- transition：`transition-hard-cut`、`transition-fade`

## Input boundary

GIF 是单个效果的可播放确认预览，SVG 是其源图和备用静态预览；二者都不是最终的整体 Remotion 成片，也不代表已经具备真实网页 DOM、鼠标路径或摄像头媒体。剪辑表格中的 `source`、`region`、`anchor` 和 `input` 用来提前暴露阶段二的输入依赖。

与现有 `github-remotion` 的衔接约定：阶段二仍以 Playwright 录制的 1920×1080 GitHub 页面视频作为网页主源，并由 Remotion 的 `OffthreadVideo` 做画面级变换。对标题、按钮、模块等网页内部元素的独立动画，必须在录制流程中补充可定位信息或拆分素材；仅有一条真实网页视频时，能稳定实现的是整画面的缩放、平移、画框、背景、聚光、标注和转场。

## Confirmation gate

阶段一输出的是“效果计划”和单个效果 GIF，不是可执行成片。自然语言解析完成后必须先给出包含 `shot`、`start`、`end`、`duration`、`source`、`target`、`effectId`、`params`、`prompt`、`status` 的剪辑表格；其中 `params` 是 JSON object，并等待用户确认。用户确认前不得调用网页录制、整体时间线执行或导出整片命令；单个效果 GIF 的生成属于阶段一预览。
