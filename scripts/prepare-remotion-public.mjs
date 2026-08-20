import {copyFileSync, existsSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadCatalog} from './validate-effect-catalog.mjs';

export function preparePublicAssets(root = resolve(import.meta.dirname, '..')) {
  const catalog = loadCatalog(root);
  const publicSvgDir = resolve(root, 'public/effect-catalog/svgs');
  const publicCaptureDir = resolve(root, 'public/capture');
  mkdirSync(publicSvgDir, {recursive: true});
  mkdirSync(publicCaptureDir, {recursive: true});

  for (const effect of catalog) {
    copyFileSync(resolve(root, effect.svg), resolve(publicSvgDir, `${effect.id}.svg`));
  }

  const sourceVideo = resolve(root, 'source/capture/github-page.mp4');
  if (!existsSync(sourceVideo)) {
    throw new Error(`Missing real GitHub capture: ${sourceVideo}. Run npm run capture:github first.`);
  }
  copyFileSync(sourceVideo, resolve(publicCaptureDir, 'github-page.mp4'));

  return {count: catalog.length, publicSvgDir, publicCaptureDir};
}

if (process.argv[1] && process.argv[1].endsWith('prepare-remotion-public.mjs')) {
  const result = preparePublicAssets();
  console.log(`Prepared ${result.count} SVG assets for Remotion in ${result.publicSvgDir}`);
}
