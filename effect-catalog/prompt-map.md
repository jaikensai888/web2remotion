# Web2Remotion 特效 Prompt 对照表

本表是阶段一的可确认资产：用户用自然语言描述后，先匹配到一个或多个 effect ID，再生成剪辑表格，用户确认后才进入阶段二的成片执行。

| Effect ID | 中文名称 | 类别 | 关键词 | Prompt 示例 | 真实 GitHub 指令 | 素材要求 | 默认参数 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| camera-zoom | 镜头平滑到标题并放大 | camera | 平滑到标题、标题放大、3倍放大、镜头推进、zoom in | 镜头平滑移动到仓库 title，然后以 title 为中心放大 3 倍 | 使用真实 GitHub 录制，先将镜头平滑移动并锁定在仓库 title，再以 title 为中心连续放大到 3 倍；保持真实页面纹理清晰。 | captured-page | `{"scaleFrom":1,"scaleTo":3,"origin":"repository-title","focusDurationMs":2500,"zoomDurationMs":2500,"easing":"easeInOut"}` |
| camera-pan | 镜头平滑平移 | camera | 平移、横向移动、纵向移动、pan | 镜头从页面左上角平滑移动到右下角 | 使用真实 GitHub 录制，从仓库标题区域平滑横向/纵向移动到文件列表区域。 | captured-page | `{"from":{"x":0,"y":0},"to":{"x":160,"y":72},"easing":"easeInOut"}` |
| perspective-tilt | 透视倾斜运镜 | camera | 透视倾斜、3D倾斜、X轴旋转、Y轴旋转、透视变形、缓慢运镜、2倍放大、重点推进、perspective tilt | 将 GitHub 网页录屏当成一张平面，进行 X/Y 轴旋转、透视变形、缓慢运镜，并放大约 2 倍突出重点 | 使用真实 GitHub 录制，把网页视频当成一张平面，同时进行更明显的 X/Y 轴旋转、透视变形、轻微横纵运镜，并缓慢放大到约 2 倍突出页面重点；保持网页内容清晰，不重绘网页。 | captured-page | `{"perspectivePx":1100,"rotateXFrom":14,"rotateXTo":-14,"rotateYFrom":-26,"rotateYTo":24,"translateFrom":{"x":-18,"y":10},"translateTo":{"x":16,"y":-8},"scaleFrom":1,"scaleTo":2,"easing":"easeInOut"}` |
| punch-in | 强调式快速推进 | camera | 快速放大、强调、冲击推进、punch in | 在按钮出现时快速推进 115%，随后回弹到 105% | 使用真实 GitHub 录制，在 README 目标标题进入画面时快速推进到 115%，再回弹到 105%。 | captured-page | `{"peakScale":1.15,"settleScale":1.05,"durationMs":420,"easing":"backOut"}` |
| cursor-smooth | 光标平滑跟随 | pointer | 光标平滑、鼠标跟随、cursor、smooth cursor | 让鼠标光标沿操作路径平滑移动，减少抖动 | 在真实 GitHub 页面录制层上叠加演示光标，让光标沿目标区域路径平滑移动；不重绘网页内容。 | captured-page-overlay | `{"smoothing":0.82,"trail":false,"cursorScale":1}` |
| cursor-sway | 光标轻微摆动 | pointer | 光标摆动、鼠标微动、sway、cursor motion | 光标停在按钮上时加入轻微自然摆动 | 在真实 GitHub 页面录制层上叠加演示光标，停在目标链接附近做轻微自然摆动。 | captured-page-overlay | `{"amplitude":3,"frequencyHz":1.1,"rotationDeg":2}` |
| click-bounce | 点击回弹 | pointer | 点击、点击回弹、click、bounce | 点击按钮时做一个轻微回弹，并显示点击波纹 | 在真实 GitHub 页面录制层上的目标链接或按钮位置叠加点击回弹和点击波纹。 | captured-page-overlay | `{"scalePeak":0.92,"settleScale":1,"ripple":true,"durationMs":260}` |
| spotlight | 聚光灯聚焦 | focus | 聚焦、聚光灯、突出区域、spotlight | 聚光灯聚焦在登录按钮上，其余区域略微变暗 | 在真实 GitHub 页面录制层上对 README 目标区域添加聚光遮罩，其余页面轻微变暗。 | captured-page-overlay | `{"radius":92,"dimOpacity":0.58,"feather":24,"followCursor":false}` |
| annotation-callout | 标注气泡 | annotation | 标注、说明气泡、箭头、callout、annotation | 在搜索框右侧出现一个带箭头的说明气泡：输入关键词 | 在真实 GitHub 页面录制层的目标标题或代码区域旁添加带箭头的说明气泡。 | captured-page-overlay | `{"label":"输入关键词","accent":"#f59e0b","enter":"fade-slide-up","durationMs":360}` |
| frame-rounded-shadow | 圆角阴影画框 | frame | 圆角画框、阴影、卡片边框、rounded frame | 给网页画面加 24px 圆角和柔和阴影 | 将真实 GitHub 页面录制放入带圆角和柔和阴影的画框中，不改变页面内容。 | captured-page | `{"radius":24,"shadowBlur":30,"shadowOpacity":0.28,"padding":20}` |
| background-gradient-blur | 渐变模糊背景 | background | 渐变背景、模糊背景、氛围背景、gradient blur | 网页后面铺一层蓝紫色渐变模糊背景 | 以真实 GitHub 页面录制作为前景，在其后添加低对比度渐变模糊氛围层。 | captured-page | `{"colors":["#38bdf8","#8b5cf6"],"blur":70,"opacity":0.72}` |
| webcam-bubble | 摄像头气泡 | overlay | 摄像头、人像气泡、头像圆窗、webcam bubble | 右下角叠加一个带白色描边的圆形人像气泡 | 在真实 GitHub 页面录制右下角叠加真实摄像头视频气泡；缺少 webcam-video 时不生成。 | requires-extra-input | `{"position":"bottom-right","size":112,"borderWidth":5,"shadow":true}` |
| browser-device-frame | 浏览器设备外框 | frame | 浏览器外框、设备框、浏览器窗口、browser frame | 把网页放进一个带地址栏的浏览器窗口外框 | 将真实 GitHub 页面录制放入带地址栏的浏览器设备外框，页面内容保持真实。 | captured-page | `{"frame":"browser","chromeHeight":34,"radius":16,"showAddressBar":true}` |
| dynamic-block-reveal | 动态模块出现 | reveal | 模块出现、依次出现、stagger、reveal | 页面里的三个模块依次淡入并向上移动 16px | 对真实 GitHub 页面中可定位的多个 DOM 区域做依次出现；只有单条录制视频时不伪造独立模块。 | requires-extra-input | `{"staggerMs":90,"distance":16,"opacityFrom":0,"opacityTo":1,"easing":"easeOut"}` |
| transition-hard-cut | 硬切转场 | transition | 硬切、直接切换、cut、hard cut | 镜头1结束后直接硬切到镜头2 | 使用真实 GitHub 录制中的两个不同时间段，做直接硬切，不重绘页面。 | captured-page | `{"durationFrames":1,"color":"#0f172a"}` |
| transition-fade | 淡入淡出转场 | transition | 淡入、淡出、溶解、fade | 镜头之间用 300ms 的淡出淡入连接 | 使用真实 GitHub 录制中的两个不同时间段，做淡入淡出连接，不重绘页面。 | captured-page | `{"durationMs":300,"color":"#0f172a","easing":"easeInOut"}` |

## 使用约定

- 先从自然语言中识别镜头意图、目标区域、开始/结束时机和强度；只选择本表已有的 effect ID。
- 生成效果时使用对应的“真实 GitHub 指令”，每次只执行一个 effect；所有可生成效果都必须以 Playwright 录制的视频作为主素材。
- 用户确认前只输出“剪辑表格”和待确认问题；不执行用户整片的整体时间线或导出。单个效果 GIF 可以在确认阶段作为真实 GitHub 效果预览。
- 每一行效果都可以覆盖默认参数，例如“轻微放大”对应较小的 `scaleTo`，“快速推进”对应 `punch-in`。
- 标记为 `requires-extra-input` 的效果不能仅凭单条 GitHub 视频生成；缺少额外素材或区域数据时必须暂停，不得用手绘网页替代。
- 阶段二才把 `remotion` 字段映射到真实网页视频的整体成片组件；本阶段 GIF/SVG 只是效果可视化预览。
