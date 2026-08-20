import {test} from 'node:test';
import assert from 'node:assert/strict';
import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {mkdtempSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {tmpdir} from 'node:os';
import {buildEffectCatalog} from '../scripts/build-effect-catalog.mjs';
import {loadCatalog, resolveCatalogSvgPath} from '../scripts/validate-effect-catalog.mjs';

const root = resolve(import.meta.dirname, '..');
const expectedIds = [
  'camera-zoom',
  'camera-pan',
  'punch-in',
  'cursor-smooth',
  'cursor-sway',
  'click-bounce',
  'spotlight',
  'annotation-callout',
  'frame-rounded-shadow',
  'background-gradient-blur',
  'webcam-bubble',
  'browser-device-frame',
  'dynamic-block-reveal',
  'transition-hard-cut',
  'transition-fade'
];

test('effect catalog contains the approved effect set exactly once', () => {
  const catalog = loadCatalog(root);
  const ids = catalog.map((effect) => effect.id);

  assert.deepEqual(ids, expectedIds);
  assert.equal(new Set(ids).size, expectedIds.length);
});

test('catalog svg paths must be relative and stay under effect-catalog/svgs', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'web2remotion-catalog-'));

  assert.equal(
    resolveCatalogSvgPath(tempRoot, 'effect-catalog/svgs/sample.svg'),
    resolve(tempRoot, 'effect-catalog/svgs/sample.svg')
  );
  assert.throws(
    () => resolveCatalogSvgPath(tempRoot, resolve(tempRoot, 'effect-catalog/svgs/sample.svg')),
    /must be relative to effect-catalog\/svgs/
  );
  assert.throws(
    () => resolveCatalogSvgPath(tempRoot, 'effect-catalog/../escape.svg'),
    /must stay within .*effect-catalog[\\/]+svgs/
  );
  assert.throws(
    () => resolveCatalogSvgPath(tempRoot, 'C:\\escape.svg'),
    /must be relative to effect-catalog\/svgs/
  );
});

test('loadCatalog rejects escaped svg paths without touching the real catalog', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'web2remotion-loader-'));
  const catalogDir = join(tempRoot, 'effect-catalog');
  mkdirSync(join(catalogDir, 'svgs'), {recursive: true});
  writeFileSync(join(catalogDir, 'effects.json'), JSON.stringify([
    {
      id: 'temp-effect',
      name: 'Temp effect',
      category: 'temp',
      keywords: ['temp'],
      promptExample: 'temp',
      defaults: {},
      svg: 'effect-catalog/svgs/temp.svg',
      render: 'temp',
      remotion: {component: 'TempEffect', input: 'captured-page', parameters: {}}
    }
  ]), 'utf8');
  writeFileSync(join(catalogDir, 'svgs', 'temp.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"></svg>', 'utf8');

  assert.equal(loadCatalog(tempRoot).length, 1);

  writeFileSync(join(catalogDir, 'effects.json'), JSON.stringify([
    {
      id: 'temp-effect',
      name: 'Temp effect',
      category: 'temp',
      keywords: ['temp'],
      promptExample: 'temp',
      defaults: {},
      svg: 'effect-catalog/svgs/temp.svg',
      render: 'temp',
      remotion: {component: 'TempEffect', input: 'captured-page'}
    }
  ]), 'utf8');
  assert.throws(() => loadCatalog(tempRoot), /remotion\.parameters must be an object/);

  writeFileSync(join(catalogDir, 'effects.json'), JSON.stringify([
    {
      id: 'temp-effect',
      name: 'Temp effect',
      category: 'temp',
      keywords: ['temp'],
      promptExample: 'temp',
      defaults: {},
      svg: '../escape.svg',
      render: 'temp',
      remotion: {component: 'TempEffect', input: 'captured-page', parameters: {}}
    }
  ]), 'utf8');
  assert.throws(() => loadCatalog(tempRoot), /must stay within .*effect-catalog[\\/]+svgs/);
});

test('every effect has prompt mapping, defaults, remotion shape, and a local SVG', () => {
  const catalog = loadCatalog(root);

  for (const effect of catalog) {
    assert.ok(effect.name, `${effect.id} is missing name`);
    assert.ok(Array.isArray(effect.keywords) && effect.keywords.length > 0, `${effect.id} is missing keywords`);
    assert.ok(effect.promptExample, `${effect.id} is missing promptExample`);
    assert.ok(effect.defaults && typeof effect.defaults === 'object', `${effect.id} is missing defaults`);
    assert.ok(effect.remotion && typeof effect.remotion === 'object', `${effect.id} is missing remotion shape`);
    assert.ok(effect.svg, `${effect.id} is missing svg path`);

    const svgPath = resolve(root, effect.svg);
    assert.ok(existsSync(svgPath), `${effect.id} SVG does not exist: ${svgPath}`);
    const svg = readFileSync(svgPath, 'utf8');
    assert.match(svg, /^<svg\b/, `${effect.id} SVG must start with <svg`);
    assert.match(svg, /viewBox="0 0 640 360"/, `${effect.id} SVG must use the catalog canvas`);
    assert.doesNotMatch(svg, /(?:<image\b|data:|https?:\/\/(?!www\.w3\.org\/2000\/svg))/i, `${effect.id} SVG must not use external image resources`);
  }
});

test('generated prompt map and preview page expose every effect exactly once', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'web2remotion-build-'));
  mkdirSync(resolve(tempRoot, 'effect-catalog'), {recursive: true});
  copyFileSync(
    resolve(root, 'effect-catalog/effects.json'),
    resolve(tempRoot, 'effect-catalog/effects.json')
  );
  const catalog = buildEffectCatalog(tempRoot);

  const generatedFiles = [
    ...catalog.map((effect) => effect.svg),
    'effect-catalog/prompt-map.md',
    'effect-catalog/preview.html',
    'effect-catalog/README.md'
  ];
  for (const relativePath of generatedFiles) {
    assert.equal(
      readFileSync(resolve(tempRoot, relativePath), 'utf8'),
      readFileSync(resolve(root, relativePath), 'utf8'),
      `generated artifact is stale: ${relativePath}`
    );
  }

  const promptMap = readFileSync(resolve(root, 'effect-catalog/prompt-map.md'), 'utf8');
  const preview = readFileSync(resolve(root, 'effect-catalog/preview.html'), 'utf8');

  for (const effect of catalog) {
    const promptMapOccurrences = promptMap.match(new RegExp(`\\| ${effect.id} \\|`, 'g')) ?? [];
    const previewOccurrences = preview.match(new RegExp(`data-effect-id="${effect.id}"`, 'g')) ?? [];
    const gifPreviewOccurrences = preview.match(new RegExp(`renders/effects/${effect.id}\\.gif`, 'g')) ?? [];
    assert.equal(promptMapOccurrences.length, 1, `${effect.id} must appear once in prompt-map.md`);
    assert.equal(previewOccurrences.length, 1, `${effect.id} must appear once as a preview card`);
    assert.equal(gifPreviewOccurrences.length, 1, `${effect.id} must expose one GIF preview`);
  }
  const catalogReadme = readFileSync(resolve(root, 'effect-catalog/README.md'), 'utf8');
  assert.match(catalogReadme, /15 个独立效果预览/);
  assert.match(catalogReadme, /当前 13 个基于真实 GitHub 录制的 GIF/);
});
