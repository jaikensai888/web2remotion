import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createGifRenderPlan, getGifOutputPath, GIF_PREVIEW_SPEC, listSkippedEffects} from '../scripts/render-effect-gifs.mjs';

const root = resolve(import.meta.dirname, '..');

test('GIF preview plan covers the approved effect catalog with one stable output per effect', () => {
  const plan = createGifRenderPlan(root);

  assert.equal(plan.length, 13);
  assert.equal(new Set(plan.map((item) => item.effectId)).size, 13);
  assert.deepEqual(GIF_PREVIEW_SPEC, {
    width: 640,
    height: 360,
    fps: 30,
    durationInFrames: 240,
    gifFps: 15
  });

  for (const item of plan) {
    assert.match(item.effectId, /^[a-z0-9-]+$/);
    assert.equal(item.outputPath, getGifOutputPath(root, item.effectId));
    assert.match(item.outputPath, /renders[\\/]effects[\\/][a-z0-9-]+\.gif$/);
    assert.match(item.instruction, /真实 GitHub/);
  }
  assert.deepEqual(listSkippedEffects(root).map((item) => item.effectId), ['webcam-bubble', 'dynamic-block-reveal']);
});

test('GIF preview source and package commands are present', () => {
  assert.ok(existsSync(resolve(root, 'src/index.jsx')));
  assert.ok(existsSync(resolve(root, 'src/EffectPreview.jsx')));
  assert.ok(existsSync(resolve(root, 'scripts/prepare-remotion-public.mjs')));
  assert.ok(existsSync(resolve(root, 'scripts/capture-github-real.mjs')));

  const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  assert.equal(packageJson.scripts['effects:render'], 'node scripts/render-effect-gifs.mjs');
  assert.equal(packageJson.scripts['effects:verify'], 'node scripts/verify-effect-gifs.mjs');
  assert.equal(packageJson.scripts['capture:github'], 'node scripts/capture-github-real.mjs');
});
