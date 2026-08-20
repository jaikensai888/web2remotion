# web2remotion

`web2remotion` 是一个面向网页演示视频的 Remotion 效果规划 skill。它把用户的自然语言描述先转换成可编辑、可确认的剪辑表格，再为后续成片阶段提供稳定的 effect ID 和参数。

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
| shot-1 | 0.0 | 2.4 | 2.4 | captured-page | title | `camera-zoom` | `{"scaleTo":1.12,"origin":"center"}` | 标题平滑放大 | pending-confirmation |
| shot-2 | 2.4 | 3.0 | 0.6 | captured-page | search-button | `click-bounce` | `{"ripple":true}` | 点击按钮回弹 | pending-confirmation |

用户确认表格前，不执行用户整片的整体时间线或整片 Remotion render；单个效果 GIF 可以使用真实 GitHub 录制作为阶段一视觉确认。确认后，阶段二才与现有 `github-remotion` 的整体成片流程衔接。
