import {existsSync, mkdirSync, readdirSync, rmSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {renderFrames, selectComposition} from '@remotion/renderer';
import {loadCatalog} from './validate-effect-catalog.mjs';
import {preparePublicAssets} from './prepare-remotion-public.mjs';

export const GIF_PREVIEW_SPEC = {
  width: 640,
  height: 360,
  fps: 30,
  durationInFrames: 240,
  gifFps: 15
};

export function getGifOutputPath(root, effectId) {
  if (!/^[a-z0-9-]+$/.test(effectId)) {
    throw new Error(`Invalid effect id for GIF output: ${effectId}`);
  }
  return resolve(root, 'renders/effects', `${effectId}.gif`);
}

export function createGifRenderPlan(root, effectFilter = process.env.EFFECT_ID ?? null) {
  return loadCatalog(root)
    .filter((effect) => effect.sourceRequirement !== 'requires-extra-input')
    .filter((effect) => !effectFilter || effect.id === effectFilter)
    .map((effect) => ({
    effectId: effect.id,
    compositionId: 'EffectPreview',
    instruction: effect.githubInstruction,
    sourceRequirement: effect.sourceRequirement,
    outputPath: getGifOutputPath(root, effect.id),
    framesDir: resolve(root, '.remotion-work/gif-frames', effect.id)
  }));
}

export function listSkippedEffects(root) {
  return loadCatalog(root)
    .filter((effect) => effect.sourceRequirement === 'requires-extra-input')
    .map((effect) => ({effectId: effect.id, reason: effect.githubInstruction}));
}

function runProcess(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {stdio: ['ignore', 'pipe', 'pipe'], ...options});
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise({stdout, stderr});
      } else {
        reject(new Error(`${command} exited with ${code}\n${stderr}`));
      }
    });
  });
}

function findBrowserExecutable() {
  const candidates = [
    process.env.REMOTION_BROWSER_EXECUTABLE,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ].filter(Boolean);
  return candidates.find((candidate) => {
    return existsSync(candidate);
  });
}

async function encodeGif(framesDir, outputPath) {
  mkdirSync(dirname(outputPath), {recursive: true});
  const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
  const filter = 'fps=15,scale=640:360:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=sierra2_4a';
  const framePadding = String(GIF_PREVIEW_SPEC.durationInFrames - 1).length;
  await runProcess(ffmpeg, [
    '-y',
    '-framerate', String(GIF_PREVIEW_SPEC.fps),
    '-i', resolve(framesDir, `frame-%0${framePadding}d.png`),
    '-vf', filter,
    '-loop', '0',
    outputPath
  ]);
}

export async function renderEffectGifs(root = resolve(import.meta.dirname, '..')) {
  preparePublicAssets(root);
  const plan = createGifRenderPlan(root);
  const skipped = listSkippedEffects(root);
  mkdirSync(resolve(root, 'renders/effects'), {recursive: true});

  const serveUrl = await bundle({
    entryPoint: resolve(root, 'src/index.jsx'),
    publicDir: resolve(root, 'public'),
    enableCaching: true,
    rootDir: root
  });

  const browserExecutable = findBrowserExecutable();
  for (const item of plan) {
    rmSync(item.framesDir, {recursive: true, force: true});
    mkdirSync(item.framesDir, {recursive: true});
    const composition = await selectComposition({
      serveUrl,
      id: item.compositionId,
      inputProps: {effectId: item.effectId},
      ...(browserExecutable ? {browserExecutable} : {})
    });

    await renderFrames({
      composition,
      serveUrl,
      inputProps: {effectId: item.effectId},
      outputDir: item.framesDir,
      imageFormat: 'png',
      imageSequencePattern: 'frame-[frame].png',
      frameRange: [0, GIF_PREVIEW_SPEC.durationInFrames - 1],
      concurrency: 2,
      ...(browserExecutable ? {browserExecutable} : {})
    });

    const frameCount = readdirSync(item.framesDir).filter((file) => file.endsWith('.png')).length;
    if (frameCount !== GIF_PREVIEW_SPEC.durationInFrames) {
      throw new Error(`${item.effectId} rendered ${frameCount} frames; expected ${GIF_PREVIEW_SPEC.durationInFrames}.`);
    }
    await encodeGif(item.framesDir, item.outputPath);
    rmSync(item.framesDir, {recursive: true, force: true});
    console.log(`Rendered ${item.effectId}: ${item.outputPath}`);
  }

  for (const item of skipped) {
    console.log(`Skipped ${item.effectId}: ${item.reason}`);
  }

  return plan;
}

if (process.argv[1] && process.argv[1].endsWith('render-effect-gifs.mjs')) {
  renderEffectGifs().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
