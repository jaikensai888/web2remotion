# web2remotion 阶段一设计：特效目录与 Prompt 映射

## 目标

在 `G:\\claude_project\\code-agent\\web2remotion` 创建新项目的第一阶段：把 Recordly 风格的视觉特效拆成独立、可预览、可复用的效果单元，为每个效果生成 SVG 预览，并建立自然语言 Prompt 到效果配置的映射表。

阶段一不实现完整成片逻辑，不录制 GitHub 页面，不处理通用录制、telemetry、时间线编辑器或多媒体输入。

## 用户流程

1. 用户描述想要的 Recordly 风格效果。
2. `web2remotion` 根据效果目录生成候选效果表和 SVG 预览。
3. 用户确认或修改效果选择。
4. 阶段一结束，保留确认后的效果目录；阶段二再把效果接入 GitHub 页面录制和剪辑表格执行。

## 阶段一效果目录

| ID | 效果 | 预览重点 |
|---|---|---|
| `camera-zoom` | 平滑放大/缩小 | 目标点、缩放曲线、焦点框 |
| `camera-pan` | 横向/纵向平移 | 相机运动方向和安全区域 |
| `punch-in` | 快速推近 | 快速缩放与回弹感 |
| `cursor-smooth` | 光标平滑移动 | 光标轨迹和缓动 |
| `cursor-sway` | 光标轻微摆动 | 光标姿态变化 |
| `click-bounce` | 点击 bounce | 点击圆环和按压反馈 |
| `spotlight` | 聚光/背景压暗 | 目标区域与遮罩 |
| `annotation-callout` | 箭头、框选、标签 | 标注进入和指向关系 |
| `frame-rounded-shadow` | 圆角画框和阴影 | 页面容器与投影 |
| `background-gradient-blur` | 渐变、壁纸、背景模糊 | 前景与背景层次 |
| `webcam-bubble` | 摄像头画中画 | 圆形/圆角窗口、阴影和位置 |
| `browser-device-frame` | 浏览器/设备框 | 设备外壳和内容窗口 |
| `dynamic-block-reveal` | 动态块逐个出现 | 卡片、标签或 UI 块的进入顺序 |
| `transition-hard-cut` | 硬切 | 两个画面的边界 |
| `transition-fade` | 淡入淡出 | 前后画面的透明度变化 |

## Prompt 映射

每个效果至少包含：

- `id`
- 中文名称
- 触发关键词
- 一条自然语言 Prompt 示例
- 默认参数
- SVG 预览路径
- Remotion 阶段二的参数形状

示例：

| Prompt | 解析效果 | 参数 |
|---|---|---|
| “让标题平滑放大到 3 倍” | `camera-zoom` | `scale: 1 → 3`、`easing: easeInOut` |
| “点击位置加一个轻微圆环 bounce” | `click-bounce` | `duration: 18 frames`、`amplitude: 1.15` |
| “页面放进圆角窗口，加深色渐变背景和阴影” | `frame-rounded-shadow` + `background-gradient-blur` | `radius: 24`、`shadow: soft` |

自然语言只负责生成候选配置；阶段二执行前必须先生成剪辑表格并等待用户确认。

## 项目结构

```text
web2remotion/
├─ .codex/skills/web2remotion/
│  ├─ SKILL.md
│  ├─ agents/openai.yaml
│  └─ references/effect-catalog.md
├─ effect-catalog/
│  ├─ effects.json
│  ├─ prompt-map.md
│  ├─ svgs/
│  └─ preview.html
├─ scripts/
│  └─ build-effect-catalog.mjs
├─ tests/
│  └─ effect-catalog.test.mjs
├─ package.json
├─ README.md
└─ AGENTS.md
```

## 验收标准

- 所有目录中的效果 ID 唯一且可检索。
- 每个效果有独立 SVG，使用内联图形，不依赖远程资源。
- 每个效果至少有一个中文 Prompt 示例和一个默认参数对象。
- 可生成一个效果总览页面，按效果分类展示 SVG 与 Prompt。
- 自动测试能发现缺少 SVG、缺少 Prompt 或重复 ID。
- 阶段一不创建完整 GitHub 录制、剪辑表格执行或最终 MP4。

## 阶段二边界

用户确认阶段一效果目录后，再实现：

- 自然语言 Prompt → 剪辑表格；
- 用户确认/修改剪辑表格；
- 复用 `github-remotion` 的 Playwright 录制契约；
- 将确认后的镜头表转换为 Remotion `Sequence`；
- 渲染和逐帧 QC。
