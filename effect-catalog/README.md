# Effect Catalog

阶段一的效果资产目录。每个效果由 `effects.json` 描述，并有一个同名的真实 GitHub 录制 GIF；SVG 仅作为旧版结构源图，不作为真实素材预览。

- `effects.json`：稳定的 effect ID、关键词、Prompt 示例、默认参数和未来 Remotion 参数形状。
- `prompt-map.md`：给用户确认剪辑表格时使用的 Prompt 对照表。
- `preview.html`：离线预览真实 GitHub GIF，不加载远程资源；缺少真实素材时明确显示未生成，不回退到手绘网页。
- `svgs/`：15 个独立效果预览，画布统一为 640×360。
- `../renders/effects/`：当前 13 个基于真实 GitHub 录制的 GIF，默认约 8 秒、640×360、15fps、无限循环；需要额外输入的效果不会生成假素材。

运行 `npm run catalog:build` 可以从目录数据重新生成 SVG、Prompt 表和预览页；运行 `npm run effects:render` 生成 GIF，运行 `npm run effects:verify` 校验输出。
