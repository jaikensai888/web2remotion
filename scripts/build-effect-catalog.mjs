import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadCatalog} from './validate-effect-catalog.mjs';

export function buildEffectCatalog(root = resolve(import.meta.dirname, '..')) {
  const outputDir = resolve(root, 'effect-catalog/svgs');
const W = 640;
const H = 360;

const colors = {
  ink: '#0f172a',
  slate: '#334155',
  muted: '#64748b',
  line: '#cbd5e1',
  surface: '#f8fafc',
  white: '#ffffff',
  cyan: '#22d3ee',
  blue: '#38bdf8',
  purple: '#8b5cf6',
  amber: '#f59e0b',
  green: '#34d399',
  pink: '#f472b6'
};

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function defs({gradient = false, blur = false, shadow = false, mask = false} = {}) {
  const parts = [];
  if (gradient) {
    parts.push(`<linearGradient id="bg-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors.blue}"/><stop offset="1" stop-color="${colors.purple}"/></linearGradient>`);
  }
  if (blur) {
    parts.push(`<filter id="blur"><feGaussianBlur stdDeviation="34"/></filter>`);
  }
  if (shadow) {
    parts.push(`<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#020617" flood-opacity=".32"/></filter>`);
  }
  if (mask) {
    parts.push(`<mask id="focus-mask"><rect width="${W}" height="${H}" fill="white"/><circle cx="420" cy="184" r="92" fill="black"/></mask>`);
  }
  return parts.length ? `<defs>${parts.join('')}</defs>` : '';
}

function shell(effect, body, options = {}) {
  const background = options.background ?? colors.ink;
  const extraDefs = defs(options);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(effect.name)}"><title>${esc(effect.name)}</title>${extraDefs}<rect width="${W}" height="${H}" fill="${background}"/>${body}<text x="28" y="332" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="14" letter-spacing="1.5">${esc(effect.id.toUpperCase())}</text></svg>\n`;
}

function browserFrame({x = 70, y = 54, width = 500, height = 248, chrome = true, opacity = 1, filter = ''} = {}) {
  const contentY = y + (chrome ? 42 : 12);
  const contentHeight = height - (chrome ? 54 : 24);
  return `<g opacity="${opacity}"${filter ? ` filter="${filter}"` : ''}><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="16" fill="${colors.surface}"/><rect x="${x}" y="${y}" width="${width}" height="${chrome ? 42 : 12}" rx="16" fill="#e2e8f0"/><rect x="${x}" y="${y + (chrome ? 29 : 8)}" width="${width}" height="${chrome ? 13 : 4}" fill="#e2e8f0"/><circle cx="${x + 20}" cy="${y + 21}" r="5" fill="#fb7185"/><circle cx="${x + 38}" cy="${y + 21}" r="5" fill="#facc15"/><circle cx="${x + 56}" cy="${y + 21}" r="5" fill="#4ade80"/><rect x="${x + 90}" y="${y + 13}" width="${width - 124}" height="16" rx="8" fill="#f8fafc"/><rect x="${x + 16}" y="${contentY}" width="${width - 32}" height="${contentHeight}" rx="10" fill="${colors.white}"/></g>`;
}

function pageContent({x = 86, y = 100, width = 468, height = 188, focus = false, opacity = 1} = {}) {
  const cardWidth = (width - 50) / 3;
  const content = `<g opacity="${opacity}"><rect x="${x + 18}" y="${y + 16}" width="${width * 0.42}" height="14" rx="7" fill="${colors.ink}"/><rect x="${x + 18}" y="${y + 40}" width="${width * 0.26}" height="8" rx="4" fill="#94a3b8"/><rect x="${x + 18}" y="${y + 67}" width="${width - 36}" height="${height - 84}" rx="12" fill="#eff6ff"/><rect x="${x + 38}" y="${y + 87}" width="${width * 0.25}" height="10" rx="5" fill="${colors.blue}"/><rect x="${x + 38}" y="${y + 110}" width="${width * 0.42}" height="8" rx="4" fill="#bfdbfe"/><rect x="${x + 38}" y="${y + 134}" width="${width * 0.16}" height="24" rx="12" fill="${colors.ink}"/>`;
  const cards = [0, 1, 2].map((index) => `<rect x="${x + 18 + index * (cardWidth + 7)}" y="${y + height - 42}" width="${cardWidth}" height="20" rx="8" fill="${index === 1 ? '#ddd6fe' : '#e2e8f0'}"/>`).join('');
  return `${content}${cards}</g>${focus ? `<rect x="${x + 26}" y="${y + 74}" width="${width - 52}" height="${height - 100}" rx="16" fill="none" stroke="${colors.amber}" stroke-width="3" stroke-dasharray="8 6"/>` : ''}`;
}

function cursor(x, y, scale = 1, rotate = 0, fill = colors.ink) {
  return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})"><path d="M0 0L0 25L7 19L13 33L18 30L12 17L22 17Z" fill="${fill}" stroke="white" stroke-width="2" stroke-linejoin="round"/></g>`;
}

function arrow(x1, y1, x2, y2, color = colors.cyan, dashed = false) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="4" stroke-linecap="round"${dashed ? ' stroke-dasharray="8 8"' : ''}/><path d="M${x2 - 12} ${y2 - 7}L${x2} ${y2}L${x2 - 12} ${y2 + 7}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${angle - 0} ${x2} ${y2})"/>`;
}

function render(effect) {
  switch (effect.render) {
    case 'camera-zoom':
      return shell(effect, `${browserFrame()}${pageContent({focus: true})}<rect x="286" y="132" width="116" height="78" rx="12" fill="none" stroke="${colors.cyan}" stroke-width="3"/><path d="M442 106C506 116 524 150 510 190" fill="none" stroke="${colors.cyan}" stroke-width="4" stroke-linecap="round"/><path d="M500 180L512 194L494 194" fill="none" stroke="${colors.cyan}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><text x="454" y="230" fill="${colors.cyan}" font-family="Arial, sans-serif" font-size="15" font-weight="700">100% → 120%</text>`);
    case 'camera-pan':
      return shell(effect, `${browserFrame()}${pageContent()}<rect x="100" y="126" width="188" height="112" rx="10" fill="none" stroke="${colors.cyan}" stroke-width="3" stroke-dasharray="9 6"/><rect x="344" y="126" width="188" height="112" rx="10" fill="none" stroke="${colors.amber}" stroke-width="3" stroke-dasharray="9 6"/>${arrow(286, 246, 344, 246)}<text x="242" y="278" fill="${colors.cyan}" font-family="Arial, sans-serif" font-size="14" font-weight="700">PAN</text>`);
    case 'perspective-tilt':
      return shell(effect, `<g transform="translate(320 180) rotate(-4) skewX(-8) scale(.96 .92) translate(-250 -124)">${browserFrame({x: 0, y: 0, width: 500, height: 248})}${pageContent({x: 16, y: 46, width: 468, height: 188})}</g><path d="M112 72L82 52M112 72L80 84M528 288L558 308M528 288L560 276" fill="none" stroke="${colors.cyan}" stroke-width="3" stroke-linecap="round"/><text x="198" y="314" fill="${colors.cyan}" font-family="Arial, sans-serif" font-size="15" font-weight="700">X/Y + PERSPECTIVE</text>`);
    case 'punch-in':
      return shell(effect, `${browserFrame()}${pageContent({focus: true})}<g stroke="${colors.pink}" stroke-width="4" stroke-linecap="round"><path d="M320 108V126M320 226V244M270 176H252M388 176H406"/><path d="M284 140L272 128M356 140L368 128M284 212L272 224M356 212L368 224"/></g><text x="250" y="278" fill="${colors.pink}" font-family="Arial, sans-serif" font-size="15" font-weight="700">PUNCH 115% → 105%</text>`);
    case 'cursor-smooth':
      return shell(effect, `${browserFrame()}${pageContent()}<path d="M148 236C202 202 196 156 256 154C312 152 304 214 362 212C414 210 420 172 474 142" fill="none" stroke="${colors.cyan}" stroke-width="4" stroke-linecap="round" stroke-dasharray="7 8"/><circle cx="148" cy="236" r="7" fill="${colors.cyan}"/><circle cx="256" cy="154" r="7" fill="${colors.cyan}"/><circle cx="362" cy="212" r="7" fill="${colors.cyan}"/>${cursor(474, 142, 1.05, -12)}<text x="198" y="278" fill="${colors.cyan}" font-family="Arial, sans-serif" font-size="15" font-weight="700">SMOOTH PATH</text>`);
    case 'cursor-sway':
      return shell(effect, `${browserFrame()}${pageContent()}<path d="M398 172C420 154 438 190 460 172C482 154 500 190 522 172" fill="none" stroke="${colors.amber}" stroke-width="3" stroke-dasharray="6 6"/>${cursor(398, 172, 1, -8, colors.slate)}${cursor(460, 172, 1, 8, colors.slate)}${cursor(522, 172, 1, -4, colors.ink)}<path d="M450 132V110M438 122L450 110L462 122" fill="none" stroke="${colors.amber}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="242" y="278" fill="${colors.amber}" font-family="Arial, sans-serif" font-size="15" font-weight="700">NATURAL SWAY</text>`);
    case 'click-bounce':
      return shell(effect, `${browserFrame()}${pageContent()}<rect x="270" y="184" width="106" height="34" rx="17" fill="${colors.ink}"/><text x="291" y="206" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="700">CLICK ME</text><circle cx="323" cy="201" r="24" fill="none" stroke="${colors.cyan}" stroke-width="3" opacity=".85"/><circle cx="323" cy="201" r="41" fill="none" stroke="${colors.cyan}" stroke-width="3" opacity=".42"/><circle cx="323" cy="201" r="56" fill="none" stroke="${colors.cyan}" stroke-width="2" opacity=".2"/>${cursor(322, 200, .8, 0)}<text x="263" y="278" fill="${colors.cyan}" font-family="Arial, sans-serif" font-size="15" font-weight="700">CLICK + BOUNCE</text>`);
    case 'spotlight':
      return shell(effect, `${browserFrame()}${pageContent()}<rect width="${W}" height="${H}" fill="#020617" opacity=".62" mask="url(#focus-mask)"/><circle cx="420" cy="184" r="94" fill="none" stroke="${colors.amber}" stroke-width="3" stroke-dasharray="8 6"/><text x="372" y="286" fill="${colors.amber}" font-family="Arial, sans-serif" font-size="15" font-weight="700">FOCUS AREA</text>`, {mask: true});
    case 'annotation-callout':
      return shell(effect, `${browserFrame()}${pageContent()}<path d="M408 148C448 112 478 112 504 130" fill="none" stroke="${colors.amber}" stroke-width="3"/><path d="M496 124L506 130L497 138" fill="none" stroke="${colors.amber}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="438" y="78" width="140" height="42" rx="12" fill="${colors.amber}"/><text x="452" y="104" fill="${colors.ink}" font-family="Arial, sans-serif" font-size="14" font-weight="700">输入关键词</text><circle cx="408" cy="148" r="6" fill="${colors.amber}"/><text x="272" y="278" fill="${colors.amber}" font-family="Arial, sans-serif" font-size="15" font-weight="700">ANNOTATION</text>`);
    case 'frame-rounded-shadow':
      return shell(effect, `<rect x="58" y="42" width="524" height="274" rx="30" fill="#1e293b" filter="url(#shadow)"/><rect x="68" y="52" width="504" height="254" rx="24" fill="${colors.surface}" stroke="white" stroke-width="4"/>${pageContent({x: 84, y: 88, width: 472, height: 194})}<text x="228" y="332" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="14" letter-spacing="1.5">${esc(effect.id.toUpperCase())}</text>`, {shadow: true});
    case 'background-gradient-blur':
      return shell(effect, `<circle cx="100" cy="66" r="120" fill="${colors.blue}" opacity=".72" filter="url(#blur)"/><circle cx="548" cy="292" r="142" fill="${colors.purple}" opacity=".72" filter="url(#blur)"/><rect x="34" y="24" width="572" height="292" rx="32" fill="none" stroke="white" opacity=".28"/>${browserFrame({x: 70, y: 54, width: 500, height: 248})}<text x="218" y="332" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="14" letter-spacing="1.5">${esc(effect.id.toUpperCase())}</text>`, {blur: true});
    case 'webcam-bubble':
      return shell(effect, `${browserFrame()}${pageContent()}<circle cx="500" cy="256" r="64" fill="#020617" opacity=".35"/><circle cx="500" cy="246" r="58" fill="${colors.white}" stroke="${colors.white}" stroke-width="5"/><circle cx="500" cy="246" r="51" fill="#bae6fd"/><circle cx="500" cy="230" r="17" fill="#f8fafc"/><path d="M468 274C474 248 526 248 532 274" fill="#38bdf8"/><circle cx="526" cy="272" r="7" fill="${colors.green}" stroke="white" stroke-width="3"/><text x="260" y="278" fill="${colors.white}" font-family="Arial, sans-serif" font-size="15" font-weight="700">WEBCAM BUBBLE</text>`);
    case 'browser-device-frame':
      return shell(effect, `<rect x="54" y="38" width="532" height="286" rx="22" fill="#020617" stroke="#64748b" stroke-width="3"/><rect x="54" y="38" width="532" height="48" rx="22" fill="#1e293b"/><rect x="54" y="72" width="532" height="14" fill="#1e293b"/><circle cx="80" cy="62" r="6" fill="#fb7185"/><circle cx="100" cy="62" r="6" fill="#facc15"/><circle cx="120" cy="62" r="6" fill="#4ade80"/><rect x="154" y="51" width="356" height="22" rx="11" fill="#334155"/><circle cx="174" cy="62" r="5" fill="${colors.green}"/>${pageContent({x: 70, y: 98, width: 500, height: 210})}<text x="226" y="342" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="14" letter-spacing="1.5">${esc(effect.id.toUpperCase())}</text>`, {});
    case 'dynamic-block-reveal':
      return shell(effect, `${browserFrame()}<g transform="translate(112 122)"><rect x="0" y="52" width="112" height="72" rx="14" fill="#dbeafe"/><rect x="128" y="30" width="112" height="72" rx="14" fill="#ddd6fe"/><rect x="256" y="8" width="112" height="72" rx="14" fill="#fce7f3"/><path d="M48 38V18M176 16V0M304 -6V-26" stroke="${colors.cyan}" stroke-width="3" stroke-linecap="round" stroke-dasharray="5 5"/><path d="M42 18L48 8L54 18M170 0L176 -10L182 0M298 -26L304 -36L310 -26" fill="none" stroke="${colors.cyan}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="24" y="94" fill="${colors.slate}" font-family="Arial, sans-serif" font-size="14" font-weight="700">01</text><text x="152" y="72" fill="${colors.slate}" font-family="Arial, sans-serif" font-size="14" font-weight="700">02</text><text x="280" y="50" fill="${colors.slate}" font-family="Arial, sans-serif" font-size="14" font-weight="700">03</text></g><text x="216" y="278" fill="${colors.cyan}" font-family="Arial, sans-serif" font-size="15" font-weight="700">STAGGER REVEAL</text>`);
    case 'transition-hard-cut':
      return shell(effect, `<g opacity=".9">${browserFrame({x: 34, y: 58, width: 270, height: 210})}${pageContent({x: 44, y: 94, width: 250, height: 158})}</g><g opacity=".9">${browserFrame({x: 336, y: 58, width: 270, height: 210})}${pageContent({x: 346, y: 94, width: 250, height: 158, focus: true})}</g><rect x="310" y="54" width="20" height="214" fill="${colors.amber}"/><text x="292" y="294" fill="${colors.amber}" font-family="Arial, sans-serif" font-size="16" font-weight="700">CUT</text>`);
    case 'transition-fade':
      return shell(effect, `<g opacity=".38">${browserFrame({x: 34, y: 58, width: 270, height: 210})}${pageContent({x: 44, y: 94, width: 250, height: 158})}</g><g opacity=".9">${browserFrame({x: 336, y: 58, width: 270, height: 210})}${pageContent({x: 346, y: 94, width: 250, height: 158})}</g><rect x="284" y="54" width="72" height="214" fill="${colors.ink}" opacity=".44"/><path d="M284 160H356" stroke="${colors.white}" stroke-width="3" stroke-dasharray="7 7"/><text x="277" y="294" fill="${colors.white}" font-family="Arial, sans-serif" font-size="16" font-weight="700">FADE 300ms</text>`);
    default:
      throw new Error(`No SVG renderer registered for ${effect.id}`);
  }
}

  const catalog = loadCatalog(root, {checkSvgs: false});
  mkdirSync(outputDir, {recursive: true});

  for (const effect of catalog) {
    const svg = render(effect);
    writeFileSync(resolve(root, effect.svg), svg, 'utf8');
  }

const markdownCell = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
  const promptRows = catalog.map((effect) => {
    const keywords = effect.keywords.map(markdownCell).join('、');
    const defaults = markdownCell(JSON.stringify(effect.defaults));
    return `| ${effect.id} | ${effect.name} | ${effect.category} | ${keywords} | ${markdownCell(effect.promptExample)} | ${markdownCell(effect.githubInstruction)} | ${effect.sourceRequirement} | \`${defaults}\` |`;
  }).join('\n');

  const promptMap = `# Web2Remotion 特效 Prompt 对照表

本表是阶段一的可确认资产：用户用自然语言描述后，先匹配到一个或多个 effect ID，再生成剪辑表格，用户确认后才进入阶段二的成片执行。

| Effect ID | 中文名称 | 类别 | 关键词 | Prompt 示例 | 真实 GitHub 指令 | 素材要求 | 默认参数 |
| --- | --- | --- | --- | --- | --- | --- | --- |
${promptRows}

## 使用约定

- 先从自然语言中识别镜头意图、目标区域、开始/结束时机和强度；只选择本表已有的 effect ID。
- 生成效果时使用对应的“真实 GitHub 指令”，每次只执行一个 effect；所有可生成效果都必须以 Playwright 录制的视频作为主素材。
- 用户确认前只输出“剪辑表格”和待确认问题；不执行用户整片的整体时间线或导出。单个效果 GIF 可以在确认阶段作为真实 GitHub 效果预览。
- 每一行效果都可以覆盖默认参数，例如“轻微放大”对应较小的 \`scaleTo\`，“快速推进”对应 \`punch-in\`。
- 标记为 \`requires-extra-input\` 的效果不能仅凭单条 GitHub 视频生成；缺少额外素材或区域数据时必须暂停，不得用手绘网页替代。
- 阶段二才把 \`remotion\` 字段映射到真实网页视频的整体成片组件；本阶段 GIF/SVG 只是效果可视化预览。
`;
  writeFileSync(resolve(root, 'effect-catalog/prompt-map.md'), promptMap, 'utf8');

  const previewCards = catalog.map((effect) => `
      <article class="card" data-effect-id="${esc(effect.id)}">
        <img class="gif-preview" src="../renders/effects/${esc(effect.id)}.gif" alt="${esc(effect.name)} real GitHub preview" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
        <div class="missing-preview" style="display:none"><strong>暂未生成真实 GIF</strong><span>${esc(effect.sourceRequirement === 'requires-extra-input' ? '需要额外真实输入或可定位 DOM 区域' : '请先运行 npm run capture:github')}</span></div>
        <div class="copy">
          <div class="meta"><code>${esc(effect.id)}</code><span>${esc(effect.category)}</span></div>
          <h2>${esc(effect.name)}</h2>
          <p>${esc(effect.promptExample)}</p>
          <p class="instruction"><strong>真实 GitHub 指令：</strong>${esc(effect.githubInstruction)}</p>
          <p class="requirement"><strong>素材要求：</strong><code>${esc(effect.sourceRequirement)}</code></p>
          <details><summary>默认参数</summary><pre>${esc(JSON.stringify(effect.defaults, null, 2))}</pre></details>
        </div>
      </article>`).join('');

  const preview = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Web2Remotion Effect Catalog</title>
    <style>
      :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #020617; color: #e2e8f0; }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 32px; background: radial-gradient(circle at top left, #172554, #020617 48%); }
      header { max-width: 1280px; margin: 0 auto 28px; }
      h1 { margin: 0 0 8px; font-size: 32px; }
      header p { margin: 0; color: #94a3b8; }
      .grid { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px; }
      .card { overflow: hidden; border: 1px solid #334155; border-radius: 18px; background: rgba(15, 23, 42, .88); box-shadow: 0 20px 60px rgba(0, 0, 0, .22); }
      .card img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: contain; background: #0f172a; }
      .missing-preview { aspect-ratio: 16 / 9; align-items: center; justify-content: center; flex-direction: column; gap: 8px; color: #cbd5e1; background: #111827; text-align: center; padding: 24px; }
      .missing-preview strong { color: #fbbf24; }
      .copy { padding: 16px 18px 18px; }
      .meta { display: flex; align-items: center; justify-content: space-between; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
      code { color: #67e8f9; }
      h2 { margin: 10px 0 6px; font-size: 20px; }
      p { margin: 0; color: #cbd5e1; line-height: 1.55; }
      .instruction { margin-top: 10px; color: #a5f3fc; font-size: 13px; }
      .requirement { margin-top: 8px; color: #94a3b8; font-size: 12px; }
      details { margin-top: 12px; color: #94a3b8; }
      pre { overflow: auto; margin: 8px 0 0; padding: 10px; border-radius: 10px; background: #020617; color: #a5f3fc; font-size: 12px; }
    </style>
  </head>
  <body>
    <header>
      <h1>Web2Remotion 特效目录</h1>
      <p>阶段一：单个特效真实 GitHub GIF 预览 + Prompt 对照。共 ${catalog.length} 个可被自然语言选择的 effect。</p>
    </header>
    <main class="grid">${previewCards}
    </main>
  </body>
</html>
`;
  writeFileSync(resolve(root, 'effect-catalog/preview.html'), preview, 'utf8');

  const renderableCount = catalog.filter((effect) => effect.sourceRequirement !== 'requires-extra-input').length;
  const catalogReadme = `# Effect Catalog

阶段一的效果资产目录。每个效果由 \`effects.json\` 描述，并有一个同名的真实 GitHub 录制 GIF；SVG 仅作为旧版结构源图，不作为真实素材预览。

- \`effects.json\`：稳定的 effect ID、关键词、Prompt 示例、默认参数和未来 Remotion 参数形状。
- \`prompt-map.md\`：给用户确认剪辑表格时使用的 Prompt 对照表。
- \`preview.html\`：离线预览真实 GitHub GIF，不加载远程资源；缺少真实素材时明确显示未生成，不回退到手绘网页。
- \`svgs/\`：${catalog.length} 个独立效果预览，画布统一为 640×360。
- \`../renders/effects/\`：当前 ${renderableCount} 个基于真实 GitHub 录制的 GIF，默认约 8 秒、640×360、15fps、无限循环；需要额外输入的效果不会生成假素材。

运行 \`npm run catalog:build\` 可以从目录数据重新生成 SVG、Prompt 表和预览页；运行 \`npm run effects:render\` 生成 GIF，运行 \`npm run effects:verify\` 校验输出。
`;
  writeFileSync(resolve(root, 'effect-catalog/README.md'), catalogReadme, 'utf8');

  console.log(`Built ${catalog.length} effect SVG sources and GIF preview catalog in ${outputDir}`);
  return catalog;
}

if (process.argv[1] && process.argv[1].endsWith('build-effect-catalog.mjs')) {
  buildEffectCatalog();
}
