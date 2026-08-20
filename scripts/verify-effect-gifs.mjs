import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {createGifRenderPlan, GIF_PREVIEW_SPEC} from './render-effect-gifs.mjs';

function runProcess(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {stdio: ['ignore', 'pipe', 'pipe']});
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolvePromise(stdout) : reject(new Error(`${command} exited with ${code}\n${stderr}`)));
  });
}

function parseRate(rate) {
  const [numerator, denominator] = String(rate).split('/').map(Number);
  return denominator ? numerator / denominator : Number(rate);
}

export async function verifyGifOutputs(root = resolve(import.meta.dirname, '..')) {
  const ffprobe = process.env.FFPROBE_PATH || 'ffprobe';
  const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
  const plan = createGifRenderPlan(root);
  const reports = [];
  const expectedDuration = GIF_PREVIEW_SPEC.durationInFrames / GIF_PREVIEW_SPEC.fps;
  const expectedGifFrames = expectedDuration * GIF_PREVIEW_SPEC.gifFps;

  for (const item of plan) {
    if (!existsSync(item.outputPath)) {
      throw new Error(`Missing GIF output: ${item.outputPath}`);
    }
    const metadataText = await runProcess(ffprobe, [
      '-v', 'error',
      '-count_frames',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,avg_frame_rate,nb_read_frames:format=duration',
      '-of', 'json',
      item.outputPath
    ]);
    const metadata = JSON.parse(metadataText);
    const stream = metadata.streams?.[0];
    const duration = Number(metadata.format?.duration);
    const frameRate = parseRate(stream?.avg_frame_rate);
    const frameCount = Number(stream?.nb_read_frames);

    if (stream?.width !== GIF_PREVIEW_SPEC.width || stream?.height !== GIF_PREVIEW_SPEC.height) {
      throw new Error(`${item.effectId} has unexpected dimensions: ${stream?.width}x${stream?.height}`);
    }
    if (!Number.isFinite(duration) || Math.abs(duration - expectedDuration) > 0.25) {
      throw new Error(`${item.effectId} has unexpected duration: ${duration}`);
    }
    if (!Number.isFinite(frameRate) || Math.abs(frameRate - GIF_PREVIEW_SPEC.gifFps) > 0.5) {
      throw new Error(`${item.effectId} has unexpected GIF fps: ${frameRate}`);
    }
    if (!Number.isFinite(frameCount) || frameCount < expectedGifFrames * .8) {
      throw new Error(`${item.effectId} has too few GIF frames: ${frameCount}`);
    }

    await runProcess(ffmpeg, ['-v', 'error', '-i', item.outputPath, '-f', 'null', '-']);
    reports.push({effectId: item.effectId, width: stream.width, height: stream.height, duration, frameRate, frameCount});
  }

  return reports;
}

if (process.argv[1] && process.argv[1].endsWith('verify-effect-gifs.mjs')) {
  verifyGifOutputs().then((reports) => {
    console.log(`Verified ${reports.length} GIF outputs.`);
    console.log(JSON.stringify(reports, null, 2));
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
