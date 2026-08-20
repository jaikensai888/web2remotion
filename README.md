# web2remotion

`web2remotion` 是一个面向网页演示视频的 AI 效果规划 skill。用户只需要用自然语言描述想要的镜头，AI 会从效果目录中匹配 effect、补齐参数，生成可编辑、可确认的剪辑表格，再为后续成片阶段提供稳定的 effect ID 和参数。

当前交付的是阶段一：基于真实 GitHub 页面录制的 13 个独立特效 GIF、2 个额外输入缺口说明、Prompt 对照表和 `web2remotion` skill。整体成片时间轴和剪辑表执行仍等用户确认后再实现。

## 阶段一内容

- `effect-catalog/effects.json`：效果源数据、关键词、默认参数和未来 Remotion 参数形状。
- `source/capture/github-page.mp4`：真实 Playwright GitHub 页面录制，当前使用 `remotion-dev/remotion`。
- `source/capture/capture-meta.json`：真实 URL、README 标题、视口、滚动锚点和录制时间线。
- `effect-catalog/svgs/`：旧版结构源图，仅用于目录数据兼容，不作为真实素材。
- `renders/effects/`：13 个可直接播放的真实 GitHub GIF；约 8 秒、640×360、15fps、无限循环。
- `effect-catalog/prompt-map.md`：自然语言 Prompt 到 effect ID 的对照表。
- `effect-catalog/preview.html`：离线查看真实 GitHub GIF；缺少额外素材时显示未生成，不回退到手绘网页。
- `.codex/skills/web2remotion/SKILL.md`：自然语言 → 剪辑表格 → 用户确认的工作流。

## 用自然语言让 AI 生成特效方案

用户不需要记住 `effectId`。把“想拍什么”告诉 AI，AI 会把自然语言映射为目录中的效果和参数，并先输出剪辑表格，等待确认后再进入执行阶段。

可以直接复制下面的请求：

```text
请使用 web2remotion 规划一个真实 GitHub 页面演示。

素材 URL：https://github.com/remotion-dev/remotion
镜头 1（0～5 秒）：镜头平滑移动到仓库 title（remotion），然后以 title 为中心放大 3 倍。

请先完成以下事项：
1. 从 effect-catalog 匹配可用特效；
2. 输出包含 shot、start、end、duration、source、target、effectId、params、prompt、status 的剪辑表；
3. 展示每个特效对应的 GIF 预览；
4. 不要执行整片渲染，先等待我确认剪辑表。
```

AI 应将这段自然语言识别为 `camera-zoom`，并生成类似下面的可编辑记录：

| shot | start | end | duration | source | target | effectId | params | status |
| --- | ---: | ---: | ---: | --- | --- | --- | --- | --- |
| shot-1 | 0.0 | 5.0 | 5.0 | captured-page | repository-title | `camera-zoom` | `{"scaleFrom":1,"scaleTo":3,"origin":"repository-title"}` | pending-confirmation |

确认方式：用户可以回复“确认，按此表执行”，也可以直接修改镜头时间、目标区域、效果强度或参数。未确认前，AI 只生成方案和单个效果预览，不执行整片成片。

## 已确认效果：镜头平滑到仓库 title 并放大 3 倍

这是第一个已确认的真实 GitHub 页面效果。主素材来自
[`remotion-dev/remotion`](https://github.com/remotion-dev/remotion)，目标区域是仓库标题 `remotion`。

### 提升提示词（可直接复制）

```text
使用真实 GitHub 页面录制作为主素材。镜头先保持完整仓库首页，
然后平滑移动并锁定到仓库 title（remotion），再以 title 为中心
连续放大到 3 倍；保持真实 GitHub 页面纹理清晰，不重绘网页内容。
```

对应参数：

- `effectId`：`camera-zoom`
- `source`：`captured-page`
- `target`：`repository-title`
- `scaleFrom`：`1`
- `scaleTo`：`3`
- `origin`：`repository-title`
- `focusDurationMs`：`2500`
- `zoomDurationMs`：`2500`

### 效果预览

![camera-zoom：镜头平滑到仓库 title 并放大 3 倍](renders/effects/camera-zoom.gif)

[单独打开 camera-zoom GIF](renders/effects/camera-zoom.gif)

这个 GIF 是约 8 秒、640×360、15fps 的单效果确认素材，使用真实 GitHub 页面录制生成；它不是最终整片。只渲染这个效果可以运行：

```powershell
$env:EFFECT_ID = "camera-zoom"
npm run effects:render
npm run effects:verify
```

## 快速验证

项目使用 Remotion 生成单个效果 GIF：

```text
npm install
npm run catalog:build
npm run catalog:validate
npm run capture:github
npm run effects:render
npm run effects:verify
npm test
```

也可以直接使用 Node：

```text
node scripts/build-effect-catalog.mjs
node scripts/validate-effect-catalog.mjs
node --test tests/**/*.test.mjs
```

默认真实输入是：`https://github.com/remotion-dev/remotion`、README 标题 `Get started`、1 个可用 README 视口。也可以通过 `GITHUB_URL`、`README_HEADING`、`SCREEN_COUNT` 环境变量替换。

在浏览器打开 `effect-catalog/preview.html` 可以直接查看真实 GitHub GIF 效果。

渲染过程使用项目内的 `.remotion-work/` 存放临时帧和缓存，不把临时帧作为项目资产提交。

## 剪辑表格示例

| shot | start | end | duration | source | target | effectId | params | prompt | status |
| --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- |
| shot-1 | 0.0 | 5.0 | 5.0 | captured-page | repository-title | `camera-zoom` | `{"scaleFrom":1,"scaleTo":3,"origin":"repository-title"}` | 镜头平滑到仓库 title，然后放大 3 倍 | pending-confirmation |
| shot-2 | 2.4 | 3.0 | 0.6 | captured-page | search-button | `click-bounce` | `{"ripple":true}` | 点击按钮回弹 | pending-confirmation |

用户确认表格前，不执行用户整片的整体时间线或整片 Remotion render；单个效果 GIF 可以使用真实 GitHub 录制作为阶段一视觉确认。确认后，阶段二才与现有 `github-remotion` 的整体成片流程衔接。
