import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadCatalog} from '../scripts/validate-effect-catalog.mjs';
import {
  DEFAULT_GITHUB_CAPTURE,
  buildCapturePlan,
  validateGithubRepositoryUrl
} from '../scripts/capture-github-real.mjs';

const root = resolve(import.meta.dirname, '..');

test('default real GitHub capture uses a public repository and measurable README plan', () => {
  assert.equal(DEFAULT_GITHUB_CAPTURE.githubUrl, 'https://github.com/remotion-dev/remotion');
  assert.equal(DEFAULT_GITHUB_CAPTURE.readmeHeading, 'Get started');
  assert.equal(DEFAULT_GITHUB_CAPTURE.screenCount, 1);
  assert.equal(validateGithubRepositoryUrl(DEFAULT_GITHUB_CAPTURE.githubUrl).href, 'https://github.com/remotion-dev/remotion');
  assert.throws(() => validateGithubRepositoryUrl('https://github.com/remotion-dev/remotion/issues/1'), /public repository URL/);
  assert.throws(() => validateGithubRepositoryUrl('https://example.com/remotion'), /public repository URL/);
});

test('capture plan contains distinct directory, heading, and later README positions', () => {
  const plan = buildCapturePlan({
    headingTop: 4200,
    directoryTop: 260,
    viewportHeight: 1080,
    scrollHeight: 12000,
    screenCount: 3
  });

  assert.equal(plan.headingY, 4080);
  assert.equal(plan.maxScrollY, 10920);
  assert.ok(plan.directoryY < plan.headingY);
  assert.ok(plan.readmeEndY > plan.headingY);
  assert.equal(plan.screenCount, 3);
});

test('every effect has a real-GitHub instruction and an explicit source requirement', () => {
  const catalog = loadCatalog(root);
  for (const effect of catalog) {
    assert.match(effect.githubInstruction, /真实 GitHub/);
    assert.ok(['captured-page', 'captured-page-overlay', 'requires-extra-input'].includes(effect.sourceRequirement));
  }
});

test('camera zoom targets the measured repository title and reaches 3x', () => {
  const catalog = loadCatalog(root);
  const cameraZoom = catalog.find((effect) => effect.id === 'camera-zoom');
  const source = readFileSync(resolve(root, 'src/EffectPreview.jsx'), 'utf8');
  const captureMeta = JSON.parse(readFileSync(resolve(root, 'source/capture/capture-meta.json'), 'utf8'));

  assert.equal(cameraZoom.defaults.scaleTo, 3);
  assert.equal(cameraZoom.defaults.origin, 'repository-title');
  assert.match(cameraZoom.promptExample, /title/);
  assert.equal(captureMeta.anchors.repositoryTitle.text, 'remotion');
  assert.match(source, /TITLE_SOURCE_POINT/);
  assert.match(source, /Freeze/);
});

test('perspective tilt keeps the real GitHub page as a 3D plane', () => {
  const catalog = loadCatalog(root);
  const perspectiveTilt = catalog.find((effect) => effect.id === 'perspective-tilt');
  const source = readFileSync(resolve(root, 'src/EffectPreview.jsx'), 'utf8');

  assert.ok(perspectiveTilt, 'perspective-tilt must be registered in the effect catalog');
  assert.equal(perspectiveTilt.sourceRequirement, 'captured-page');
  assert.equal(perspectiveTilt.defaults.perspectivePx, 1100);
  assert.equal(perspectiveTilt.defaults.scaleFrom, 1);
  assert.equal(perspectiveTilt.defaults.scaleTo, 2);
  assert.equal(perspectiveTilt.defaults.rotateXFrom, 14);
  assert.equal(perspectiveTilt.defaults.rotateYFrom, -26);
  assert.match(perspectiveTilt.promptExample, /透视/);
  assert.match(source, /perspective-tilt/);
  assert.match(source, /perspective\(/);
  assert.match(source, /rotateX/);
  assert.match(source, /rotateY/);
  assert.match(source, /\[14, 9, -2, -14\]/);
  assert.match(source, /\[-26, -16, 8, 24\]/);
  assert.match(source, /\[1, 1\.06, 2\]/);
});

test('real source composition uses OffthreadVideo instead of drawing a fake webpage', () => {
  const source = readFileSync(resolve(root, 'src/EffectPreview.jsx'), 'utf8');
  assert.match(source, /OffthreadVideo/);
  assert.match(source, /capture\/github-page\.mp4/);
  assert.doesNotMatch(source, /effect-catalog\/svgs/);
});
