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

test('real source composition uses OffthreadVideo instead of drawing a fake webpage', () => {
  const source = readFileSync(resolve(root, 'src/EffectPreview.jsx'), 'utf8');
  assert.match(source, /OffthreadVideo/);
  assert.match(source, /capture\/github-page\.mp4/);
  assert.doesNotMatch(source, /effect-catalog\/svgs/);
});
