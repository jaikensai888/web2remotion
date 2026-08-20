import {existsSync, readFileSync} from 'node:fs';
import {isAbsolute, relative, resolve} from 'node:path';

const CATALOG_RELATIVE_PATH = 'effect-catalog/effects.json';
const SVG_CATALOG_RELATIVE_DIR = 'effect-catalog/svgs';

export function resolveCatalogSvgPath(root, svgPath) {
  if (isAbsolute(svgPath)) {
    throw new Error(`SVG path must be relative to ${SVG_CATALOG_RELATIVE_DIR}: ${svgPath}`);
  }

  const svgRoot = resolve(root, SVG_CATALOG_RELATIVE_DIR);
  const resolvedSvgPath = resolve(root, svgPath);
  const relativePath = relative(svgRoot, resolvedSvgPath);

  if (relativePath === '' || relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error(`SVG path must stay within ${svgRoot}: ${svgPath}`);
  }

  return resolvedSvgPath;
}

export function loadCatalog(root, {checkSvgs = true} = {}) {
  const catalogPath = resolve(root, CATALOG_RELATIVE_PATH);

  if (!existsSync(catalogPath)) {
    throw new Error(`Effect catalog not found: ${catalogPath}`);
  }

  let catalog;
  try {
    catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  } catch (error) {
    throw new Error(`Effect catalog is not valid JSON: ${error.message}`);
  }

  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new Error('Effect catalog must be a non-empty array.');
  }

  const ids = new Set();
  for (const [index, effect] of catalog.entries()) {
    const location = `effects[${index}]`;
    if (!effect || typeof effect !== 'object') {
      throw new Error(`${location} must be an object.`);
    }
    for (const field of ['id', 'name', 'category', 'promptExample', 'svg', 'render']) {
      if (typeof effect[field] !== 'string' || effect[field].trim() === '') {
        throw new Error(`${location}.${field} must be a non-empty string.`);
      }
    }
    if (ids.has(effect.id)) {
      throw new Error(`Duplicate effect id: ${effect.id}`);
    }
    ids.add(effect.id);
    if (!Array.isArray(effect.keywords) || effect.keywords.length === 0) {
      throw new Error(`${effect.id}.keywords must be a non-empty array.`);
    }
    if (!effect.defaults || typeof effect.defaults !== 'object' || Array.isArray(effect.defaults)) {
      throw new Error(`${effect.id}.defaults must be an object.`);
    }
    if (!effect.remotion || typeof effect.remotion !== 'object' || Array.isArray(effect.remotion)) {
      throw new Error(`${effect.id}.remotion must be an object.`);
    }
    for (const field of ['component', 'input']) {
      if (typeof effect.remotion[field] !== 'string' || effect.remotion[field].trim() === '') {
        throw new Error(`${effect.id}.remotion.${field} must be a non-empty string.`);
      }
    }
    if (!effect.remotion.parameters || typeof effect.remotion.parameters !== 'object' || Array.isArray(effect.remotion.parameters)) {
      throw new Error(`${effect.id}.remotion.parameters must be an object.`);
    }
    const svgPath = resolveCatalogSvgPath(root, effect.svg);
    if (checkSvgs) {
      if (!existsSync(svgPath)) {
        throw new Error(`${effect.id} SVG does not exist: ${svgPath}`);
      }
      const svg = readFileSync(svgPath, 'utf8');
      if (!/^<svg\b/.test(svg)) {
        throw new Error(`${effect.id} SVG must start with <svg.`);
      }
      if (!/viewBox="0 0 640 360"/.test(svg)) {
        throw new Error(`${effect.id} SVG must use viewBox=\"0 0 640 360\".`);
      }
      if (/(?:<image\b|data:|https?:\/\/(?!www\.w3\.org\/2000\/svg))/i.test(svg)) {
        throw new Error(`${effect.id} SVG contains an external image resource.`);
      }
    }
  }

  return catalog;
}

if (process.argv[1] && process.argv[1].endsWith('validate-effect-catalog.mjs')) {
  try {
    const root = resolve(import.meta.dirname, '..');
    const catalog = loadCatalog(root);
    console.log(`Valid effect catalog: ${catalog.length} effects.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
