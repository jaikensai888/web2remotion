import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve} from 'node:path';

const execFileAsync = promisify(execFile);

export const DEFAULT_GITHUB_CAPTURE = {
  githubUrl: 'https://github.com/remotion-dev/remotion',
  readmeHeading: 'Get started',
  screenCount: 1,
  viewport: {width: 1920, height: 1080},
  outputDurationSeconds: 8.4,
  topHoldMs: 3000,
  directorySweepMs: 1000,
  headingTravelMs: 1000,
  readmeScrollMs: 3000,
  finalHoldMs: 300
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeHeading = (value) => String(value ?? '')
  .normalize('NFKC')
  .replace(/\s+/g, ' ')
  .trim()
  .toLocaleLowerCase();

export function validateGithubRepositoryUrl(input) {
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error(`Expected a public repository URL, received: ${input}`);
  }

  const parts = parsed.pathname.split('/').filter(Boolean);
  const isRepositoryPath = parts.length === 2 || (parts.length >= 4 && parts[2] === 'tree');
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'github.com' || !isRepositoryPath) {
    throw new Error(`Expected a public repository URL, received: ${input}`);
  }

  return parsed;
}

export function buildCapturePlan({headingTop, directoryTop = null, viewportHeight, scrollHeight, screenCount}) {
  const maxScrollY = Math.max(0, Math.round(scrollHeight - viewportHeight));
  const headingY = clamp(Math.round(headingTop - 120), 0, maxScrollY);
  const directoryY = clamp(
    Math.round((directoryTop ?? Math.max(0, headingTop - viewportHeight)) + viewportHeight * 0.8),
    0,
    maxScrollY
  );
  const readmeEndY = clamp(
    Math.round(headingY + Math.max(0, screenCount - 1) * viewportHeight),
    0,
    maxScrollY
  );

  return {directoryY, headingY, readmeEndY, maxScrollY, screenCount};
}

function captureConfigFromEnv() {
  const screenCount = Number.parseInt(process.env.SCREEN_COUNT ?? String(DEFAULT_GITHUB_CAPTURE.screenCount), 10);
  if (!Number.isInteger(screenCount) || screenCount < 1 || screenCount > 12) {
    throw new Error('SCREEN_COUNT must be an integer from 1 to 12.');
  }

  return {
    ...DEFAULT_GITHUB_CAPTURE,
    githubUrl: process.env.GITHUB_URL ?? DEFAULT_GITHUB_CAPTURE.githubUrl,
    readmeHeading: process.env.README_HEADING ?? DEFAULT_GITHUB_CAPTURE.readmeHeading,
    screenCount
  };
}

const wait = (durationMs) => new Promise((resolvePromise) => setTimeout(resolvePromise, durationMs));

async function smoothScrollTo(page, targetY, durationMs) {
  const startY = await page.evaluate(() => window.scrollY);
  const startedAt = Date.now();

  while (true) {
    const progress = clamp((Date.now() - startedAt) / durationMs, 0, 1);
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    await page.evaluate((y) => window.scrollTo(0, y), startY + (targetY - startY) * eased);
    if (progress >= 1) return;
    await page.waitForTimeout(33);
  }
}

async function findHeadingInfo(page, heading) {
  const normalized = normalizeHeading(heading);
  return page.evaluate((wanted) => {
    const normalize = (value) => String(value ?? '')
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase();
    const candidates = Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6'));
    const match = candidates.find((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && normalize(node.textContent) === wanted;
    });
    if (!match) return null;
    const rect = match.getBoundingClientRect();
    return {
      text: (match.textContent ?? '').trim(),
      tagName: match.tagName.toLowerCase(),
      top: Math.round(rect.top + window.scrollY),
      height: Math.round(rect.height)
    };
  }, normalized);
}

async function collectPageAnchors(page, heading) {
  const headingInfo = await findHeadingInfo(page, heading);
  if (!headingInfo) {
    const headings = await page.evaluate(() => Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6'))
      .map((node) => (node.textContent ?? '').trim())
      .filter(Boolean)
      .slice(0, 80));
    throw new Error(`README heading not found: ${heading}. Available headings: ${headings.join(' | ')}`);
  }

  const pageMetrics = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6'));
    const directory = candidates.find((node) => /^(folders and files|files)$/i.test((node.textContent ?? '').trim()));
    const rect = directory?.getBoundingClientRect();
    return {
      scrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      scrollY: window.scrollY,
      directoryTop: rect ? Math.round(rect.top + window.scrollY) : null
    };
  });

  return {
    ...pageMetrics,
    heading: headingInfo,
    plan: buildCapturePlan({
      headingTop: headingInfo.top,
      directoryTop: pageMetrics.directoryTop,
      viewportHeight: pageMetrics.viewportHeight,
      scrollHeight: pageMetrics.scrollHeight,
      screenCount: DEFAULT_GITHUB_CAPTURE.screenCount
    })
  };
}

async function assertGithubPageReady(page, heading) {
  await page.locator('main').waitFor({state: 'visible', timeout: 60000});
  try {
    await page.waitForFunction((wanted) => {
      const normalize = (value) => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
      return Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6'))
        .some((node) => node.getBoundingClientRect().width > 0 && normalize(node.textContent) === normalize(wanted));
    }, heading, {timeout: 60000});
  } catch (error) {
    const diagnostics = await page.evaluate(() => ({
      title: document.title,
      url: location.href,
      headings: Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6'))
        .map((node) => (node.textContent ?? '').trim())
        .filter(Boolean)
        .slice(0, 80),
       bodyText: (document.body.innerText ?? '').slice(0, 1800)
    }));
    throw new Error(`README heading not found: ${heading}. GitHub diagnostics: ${JSON.stringify(diagnostics)}`, {cause: error});
  }

  const bodyText = await page.locator('body').innerText();
  if (/captcha|verify you are human|access denied|sign in to github/i.test(bodyText)) {
    throw new Error('GitHub presented a blocking interstitial instead of the repository page.');
  }
}

async function transcodeToMp4(inputPath, outputPath, startSeconds, durationSeconds) {
  const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
  await execFileAsync(ffmpeg, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', inputPath,
    '-ss', startSeconds.toFixed(3),
    '-t', durationSeconds.toFixed(3),
    '-an',
    '-c:v', process.env.FFMPEG_ENCODER || 'h264_nvenc',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-movflags', '+faststart',
    outputPath
  ], {windowsHide: true});
}

export async function captureGithubReal({root = resolve(import.meta.dirname, '..'), config = captureConfigFromEnv()} = {}) {
  const parsedUrl = validateGithubRepositoryUrl(config.githubUrl);
  const screenCount = Number(config.screenCount);
  if (!Number.isInteger(screenCount) || screenCount < 1 || screenCount > 12) {
    throw new Error('screenCount must be an integer from 1 to 12.');
  }

  const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!existsSync(chromePath)) {
    throw new Error(`Chrome executable not found: ${chromePath}`);
  }

  const sourceDir = resolve(root, 'source/capture');
  const tempDir = resolve(root, '.remotion-work/capture');
  const outputPath = resolve(sourceDir, 'github-page.mp4');
  const metadataPath = resolve(sourceDir, 'capture-meta.json');
  mkdirSync(sourceDir, {recursive: true});
  mkdirSync(tempDir, {recursive: true});

  const {chromium} = await import('playwright');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-extensions', '--no-first-run', '--no-default-browser-check']
  });
  const context = await browser.newContext({
    viewport: config.viewport,
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    recordVideo: {dir: tempDir, size: config.viewport}
  });
  await context.addInitScript(() => {
    window.localStorage.setItem('preferred_color_mode', 'dark');
    window.localStorage.setItem('color_mode', 'dark');
  });

  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  const recordingStartedAt = Date.now();
  let generatedVideoPath;
  let anchors;
  let readyOffsetMs = 0;

  try {
    await page.goto(parsedUrl.href, {waitUntil: 'domcontentloaded', timeout: 60000});
    await page.waitForTimeout(3500);
    await page.emulateMedia({colorScheme: 'dark'});
    await assertGithubPageReady(page, config.readmeHeading);
    readyOffsetMs = Date.now() - recordingStartedAt;
    anchors = await collectPageAnchors(page, config.readmeHeading);
    anchors.plan = buildCapturePlan({
      headingTop: anchors.heading.top,
      directoryTop: anchors.directoryTop,
      viewportHeight: anchors.viewportHeight,
      scrollHeight: anchors.scrollHeight,
      screenCount
    });

    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(config.topHoldMs);
    await smoothScrollTo(page, anchors.plan.directoryY, config.directorySweepMs);
    await smoothScrollTo(page, anchors.plan.headingY, config.headingTravelMs);
    await smoothScrollTo(page, anchors.plan.readmeEndY, config.readmeScrollMs);
    await wait(config.finalHoldMs);

    const video = page.video();
    if (!video) throw new Error('Playwright did not create a recorded video handle.');
    await context.close();
    generatedVideoPath = await video.path();
  } catch (error) {
    await context.close().catch(() => {});
    throw error;
  } finally {
    await browser.close().catch(() => {});
  }

  const warmupSeconds = Math.max(0, readyOffsetMs / 1000 - 0.65);
  await transcodeToMp4(generatedVideoPath, outputPath, warmupSeconds, config.outputDurationSeconds);
  const metadata = {
    sourceUrl: parsedUrl.href,
    readmeHeading: config.readmeHeading,
    screenCount,
    capturedAt: new Date().toISOString(),
    chromePath,
    viewport: config.viewport,
    readyOffsetMs,
    warmupSeconds,
    timeline: {
      topHoldMs: config.topHoldMs,
      directorySweepMs: config.directorySweepMs,
      headingTravelMs: config.headingTravelMs,
      readmeScrollMs: config.readmeScrollMs,
      finalHoldMs: config.finalHoldMs
    },
    anchors,
    files: {
      sourceVideo: 'source/capture/github-page.mp4',
      manifest: 'source/capture/capture-meta.json'
    }
  };
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  return {outputPath, metadataPath, metadata};
}

if (process.argv[1] && process.argv[1].endsWith('capture-github-real.mjs')) {
  captureGithubReal().then((result) => {
    console.log(JSON.stringify(result, null, 2));
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
