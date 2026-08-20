---
name: web2remotion
description: Use when a user wants to turn a real GitHub web-demo animation idea into a natural-language-selected effect plan, with per-effect GIF previews before any overall Remotion composition or rendering.
---

# Web2Remotion

## Overview

用户不需要记住 effect ID。把对真实 GitHub 网页演示动画的自然语言描述交给 AI，AI 读取本项目的效果目录，将描述映射到稳定的 effect ID、默认参数和剪辑表格。阶段一先用 Playwright 录制真实 GitHub 页面，再按每个 effect 的独立 `githubInstruction` 逐个生成 GIF；生成整片前仍要求用户确认剪辑表格。

## Scope and phase boundary

本技能当前只负责：

- 读取项目根目录的 `effect-catalog/effects.json` 和 `effect-catalog/prompt-map.md`。
- 从 Prompt 中识别镜头、时间、目标区域、效果强度和转场。
- 输出可编辑的剪辑表格，并明确哪些参数是默认值、哪些是推断值。
- 展示对应 GIF 预览路径，必要时同时提供 SVG 源图，方便用户逐个确认效果。

阶段一允许运行 `npm run capture:github` 获取真实网页素材，再运行 `npm run effects:render` 逐个生成单个效果 GIF。这不是用户剪辑表格的整片执行。

没有得到用户明确确认前，不录制网页、不生成整片、不执行整体时间线；用户确认具体样例输入后，可以按本阶段边界录制真实 GitHub 页面并生成逐个效果 GIF。

本阶段明确不负责：通用录制、光标/点击 telemetry、时间线编辑器、多媒体输入模型、PixiJS/Canvas 重绘、MP4 输出和整体成片逻辑。阶段一允许使用 `github-remotion` 的真实 GitHub 页面录制契约生成预览素材。

## Workflow

### 0. Accept a natural-language request

用户可以只描述意图，不必指定内部 ID。例如：

```text
镜头 1（0～5 秒）：镜头平滑移动到仓库 title，然后以 title 为中心放大 3 倍。
请先给我剪辑表和对应 GIF，等我确认后再执行整片。
```

AI 必须先读取 `effects.json` 和 `prompt-map.md`，再将描述映射为已登记的 effect。对当前目录，这个请求应匹配 `camera-zoom`，目标区域为 `repository-title`，放大参数为 `scaleTo=3`。如果用户没有给出时间或强度，必须标记为建议值或推断值，不能伪装成用户指定值。

### 1. Read the effect catalog

先按 `id` 查目录，不自行创造未登记的效果名。每个匹配项必须能追溯到：

- 一个 effect ID；
- 一个 Prompt 示例或关键词命中；
- 一组默认参数；
- 一个本地真实 GitHub GIF 预览；SVG 仅作为旧版结构源图；
- 一条 `githubInstruction` 和一个 `sourceRequirement`；没有对应真实输入时必须跳过，不得用手绘网页代替。

如果一个句子同时表达“镜头放大 + 标注 + 点击”，拆成同一镜头的多个效果，或拆成连续镜头；不要把多个效果压成一个不可解释的自定义名称。

### 2. Parse the natural-language request

至少提取以下字段：

- 镜头顺序和镜头目的；
- 开始时间、结束时间或时长。若用户没有提供，给出“建议值”，不得伪装成用户指定值；
- 来源和目标区域，例如“网页主画面”“标题”“按钮”“右下角”；
- effect ID、强度、方向、锚点、进入/退出方式；
- 依赖的输入，例如真实网页视频、手工光标位置或外部视频。只记录依赖，不在阶段一执行。

### 3. Generate the editing table

默认使用如下稳定字段，不固定为 8 秒。字段名是阶段一和阶段二之间的机器可读契约，不能用同义中文列名替换：

| shot | start | end | duration | source | target | effectId | params | prompt | status |
| --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- |
| shot-1 | 0.0 | 5.0 | 5.0 | captured-page | repository-title | `camera-zoom` | `{"scaleFrom":1,"scaleTo":3,"origin":"repository-title"}` | 镜头平滑到仓库 title，然后放大 3 倍 | pending-confirmation |

`params` 必须是可解析的 JSON object；如果展示为 `key=value`，也必须明确它等价于 object，不能输出无法消费的自由文本。

表格要求：

- 同一个镜头叠加多个效果时，用分行或“效果链”明确顺序，并为每行保留完整的 `shot`、`start`、`end`、`duration`、`source`、`target`、`effectId`、`params`、`prompt`、`status`；
- 参数优先使用 `effects.json` 的默认值，并标记用户没有说过的推断；
- 时间有冲突、目标区域不清或效果不在目录中时，在表格下方列出待确认问题；
- 需要“标题单独放大”时，标记为 `region=title`。当前网页录制模式只会把网页作为视频源，阶段二要实现真正的局部标题独立动画，必须有可定位的区域或拆分素材；不要在阶段一承诺已经可以独立控制网页 DOM。

### 4. Show previews and request confirmation

表格后列出每个使用到的 GIF，例如：

`renders/effects/camera-zoom.gif` — 基于真实 GitHub 页面录制的镜头平滑放大

然后必须明确写出“请确认剪辑表格；你可以直接修改镜头时间、Effect ID 或参数”。单个效果 GIF 只用于确认效果本身，不代表整体剪辑已经执行。

在用户明确回复“确认/开始执行/按此表执行”之前，必须停止在阶段一。用户提出修改时，更新表格并再次等待用户确认。

## Stage-two handoff

只有确认后，才可以把表格交给阶段二的成片流程：

1. 用现有 `github-remotion` 技能按 GitHub URL、README heading、screen count 录制真实网页视频；
2. 将表格中的效果映射到 Remotion 的 `OffthreadVideo` 变换、叠加层和转场；
3. 对需要独立元素的效果，先检查录制数据是否提供区域/光标路径。当前 `github-remotion` 的真实网页视频不是 DOM 图层，不能仅凭 Remotion 变换让网页内部标题、按钮或模块获得独立动画；
4. 若输入缺失，只报告缺口并回到用户确认，不偷偷引入 telemetry、PixiJS 或新的多媒体模型。

阶段一不创建成片时间轴运行器。这里的时间列只是用户确认用的剪辑计划，允许任意总时长和任意镜头数量。

## Local resources

- `../../../effect-catalog/effects.json`：机器可读的效果源数据。
- `../../../effect-catalog/prompt-map.md`：人类可读的 Prompt 对照表。
- `../../../source/capture/capture-meta.json`：真实 GitHub URL、README 标题、滚动锚点和录制 manifest。
- `../../../effect-catalog/preview.html`：全部真实 GIF 的离线预览页，缺少额外输入时显示未生成。
- `references/effect-catalog.md`：效果类别、输入边界和阶段二交接说明。
