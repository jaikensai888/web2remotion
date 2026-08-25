import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Freeze,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame
} from 'remotion';
import captureMeta from '../source/capture/capture-meta.json';

export const EFFECT_PREVIEW_SPEC = {
  width: 640,
  height: 360,
  fps: 30,
  durationInFrames: 240,
  gifFps: 15
};

const EFFECT_IDS = [
  'camera-zoom', 'camera-pan', 'perspective-tilt', 'punch-in', 'cursor-smooth', 'cursor-sway',
  'click-bounce', 'spotlight', 'annotation-callout', 'frame-rounded-shadow',
  'background-gradient-blur', 'webcam-bubble', 'browser-device-frame',
  'dynamic-block-reveal', 'transition-hard-cut', 'transition-fade'
];

const SOURCE = staticFile('capture/github-page.mp4');
const TITLE_FOCUS = {x: 320, y: 142};
const TITLE_ANCHOR = captureMeta.anchors?.repositoryTitle ?? {
  centerX: 235,
  centerY: 102
};
const CAPTURE_VIEWPORT = captureMeta.viewport ?? {width: 1920, height: 1080};
const TITLE_SOURCE_POINT = {
  x: (TITLE_ANCHOR.centerX / CAPTURE_VIEWPORT.width) * EFFECT_PREVIEW_SPEC.width,
  y: (TITLE_ANCHOR.centerY / CAPTURE_VIEWPORT.height) * EFFECT_PREVIEW_SPEC.height
};
const TITLE_FREEZE_FRAME = Math.max(
  0,
  Math.round(((captureMeta.timeline?.topHoldMs ?? 3000) / 1000) * EFFECT_PREVIEW_SPEC.fps) - 1
);
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const frameProgress = (frame, start = 0, end = EFFECT_PREVIEW_SPEC.durationInFrames - 1) =>
  clamp01((frame - start) / Math.max(1, end - start));
const valueAt = (frame, range, values, easing = Easing.inOut(Easing.cubic)) => interpolate(frame, range, values, {
  easing,
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp'
});

function VideoLayer({style = {}, startFrom = 0}) {
  return (
    <OffthreadVideo
      src={SOURCE}
      startFrom={startFrom}
      muted
      volume={0}
      delayRenderTimeoutInMilliseconds={120000}
      style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style}}
    />
  );
}

function PerspectiveVideoLayer({style = {}}) {
  return (
    <Freeze frame={0}>
      <VideoLayer style={style} />
    </Freeze>
  );
}

function pageTransform(effectId, frame) {
  switch (effectId) {
    case 'camera-pan': {
      const x = valueAt(frame, [0, 90, 180, 239], [0, -16, -48, -72]);
      const y = valueAt(frame, [0, 90, 180, 239], [0, -6, -26, -38]);
      return `translate(${x}px, ${y}px) scale(1.08)`;
    }
    case 'punch-in': {
      const scale = valueAt(frame, [0, 104, 118, 138, 239], [1, 1, 1.15, 1.05, 1.05], Easing.out(Easing.quad));
      return `scale(${scale})`;
    }
    case 'frame-rounded-shadow':
      return `scale(${valueAt(frame, [0, 30, 239], [.94, 1, 1])})`;
    case 'background-gradient-blur':
      return `scale(${valueAt(frame, [0, 239], [1.01, 1.04])})`;
    case 'browser-device-frame':
      return `scale(${valueAt(frame, [0, 45, 239], [.96, 1, 1])})`;
    default:
      return 'scale(1)';
  }
}

function titleZoomTransform(frame) {
  const travelProgress = valueAt(frame, [0, 75], [0, 1]);
  const scale = frame <= 75
    ? valueAt(frame, [0, 75], [1, 1.08])
    : valueAt(frame, [75, 150], [1.08, 3]);
  const focusTranslation = frame <= 75 ? travelProgress : 1;
  const translateX = (TITLE_FOCUS.x - TITLE_SOURCE_POINT.x * scale) * focusTranslation;
  const translateY = (TITLE_FOCUS.y - TITLE_SOURCE_POINT.y * scale) * focusTranslation;
  return {
    transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
    transformOrigin: '0 0'
  };
}

const PERSPECTIVE_TILT_END_FRAME = 60;
const PERSPECTIVE_PLANE_CENTER = {
  x: EFFECT_PREVIEW_SPEC.width / 2,
  y: EFFECT_PREVIEW_SPEC.height / 2
};
const PERSPECTIVE_TITLE_FOCUS = {x: 220, y: 80};
const PERSPECTIVE_TITLE_TRANSLATION = {
  x: PERSPECTIVE_TITLE_FOCUS.x - (
    PERSPECTIVE_PLANE_CENTER.x + (TITLE_SOURCE_POINT.x - PERSPECTIVE_PLANE_CENTER.x) * 2
  ),
  y: PERSPECTIVE_TITLE_FOCUS.y - (
    PERSPECTIVE_PLANE_CENTER.y + (TITLE_SOURCE_POINT.y - PERSPECTIVE_PLANE_CENTER.y) * 2
  )
};

function perspectiveTiltTransform(frame) {
  const rotateX = valueAt(frame, [0, PERSPECTIVE_TILT_END_FRAME, 239], [0, 14, 14]);
  const rotateY = valueAt(frame, [0, PERSPECTIVE_TILT_END_FRAME, 239], [0, -26, -26]);
  const translateX = PERSPECTIVE_TITLE_TRANSLATION.x + valueAt(frame, [0, PERSPECTIVE_TILT_END_FRAME, 239], [0, 0, 16]);
  const translateY = PERSPECTIVE_TITLE_TRANSLATION.y + valueAt(frame, [0, PERSPECTIVE_TILT_END_FRAME, 239], [0, 0, -8]);
  const scale = 2;
  return `perspective(1100px) translate3d(${translateX}px, ${translateY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
}

function PerspectiveTiltPage({frame}) {
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: 'radial-gradient(circle at 30% 20%, #1d4ed8 0%, #0b1220 46%, #020617 100%)'}}>
      <div style={{position: 'absolute', inset: -28, opacity: .22, filter: 'blur(26px) saturate(1.1)', transform: 'scale(1.08)'}}>
        <PerspectiveVideoLayer />
      </div>
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', transformStyle: 'preserve-3d'}}>
        <div style={{width: '100%', height: '100%', overflow: 'hidden', borderRadius: 18, boxShadow: '0 24px 64px rgba(0,0,0,.46)', transform: perspectiveTiltTransform(frame), transformOrigin: 'center center', transformStyle: 'preserve-3d', backfaceVisibility: 'hidden', willChange: 'transform'}}>
          <PerspectiveVideoLayer />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function TitleZoomPage({frame}) {
  const style = titleZoomTransform(frame);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Sequence from={0} durationInFrames={TITLE_FREEZE_FRAME + 1}>
        <VideoLayer style={style} />
      </Sequence>
      <Sequence from={TITLE_FREEZE_FRAME + 1}>
        <Freeze frame={TITLE_FREEZE_FRAME}>
          <VideoLayer style={style} />
        </Freeze>
      </Sequence>
    </AbsoluteFill>
  );
}

function CursorGlyph({x, y, rotation = 0, opacity = 1}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(.8)`} opacity={opacity}>
      <path d="M0 0L0 25L7 19L13 33L18 30L12 17L22 17Z" fill="#111827" stroke="white" strokeWidth="2" strokeLinejoin="round" />
    </g>
  );
}

function CursorOverlay({effectId, frame}) {
  const p = frameProgress(frame, 30, 180);
  const x = valueAt(p, [0, .35, .7, 1], [390, 450, 360, 490]);
  const y = valueAt(p, [0, .35, .7, 1], [175, 198, 150, 190]);
  const sway = effectId === 'cursor-sway' ? Math.sin(frame / 7) * 5 : 0;
  const rotation = effectId === 'cursor-sway' ? Math.sin(frame / 7) * 5 : -10;
  return (
    <svg width="640" height="360" viewBox="0 0 640 360" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {effectId === 'cursor-smooth' && (
        <path d="M390 175C430 150 455 220 360 150C410 130 452 180 490 190" fill="none" stroke="#22d3ee" strokeWidth="3" strokeDasharray="7 8" opacity=".42" />
      )}
      <circle cx={x + sway} cy={y} r="6" fill="#22d3ee" opacity=".85" />
      <CursorGlyph x={x + sway} y={y} rotation={rotation} />
    </svg>
  );
}

function ClickOverlay({frame}) {
  const p = frameProgress(frame, 108, 138);
  const radius = valueAt(p, [0, 1], [10, 72]);
  const opacity = valueAt(p, [0, 1], [.9, 0]);
  const scale = valueAt(p, [0, .35, 1], [1, .92, 1]);
  return (
    <svg width="640" height="360" viewBox="0 0 640 360" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <g transform={`translate(430 190) scale(${scale}) translate(-430 -190)`}>
        <circle cx="430" cy="190" r={radius} fill="none" stroke="#22d3ee" strokeWidth="4" opacity={opacity} />
        <circle cx="430" cy="190" r={radius * .7} fill="#22d3ee" opacity={opacity * .1} />
      </g>
      <CursorGlyph x={428} y={188} opacity={p < .55 ? 1 : .25} />
    </svg>
  );
}

function SpotlightOverlay({frame}) {
  const radius = valueAt(frame, [75, 120, 180], [62, 94, 108]);
  return (
    <svg width="640" height="360" viewBox="0 0 640 360" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <defs>
        <mask id="github-real-spotlight-mask">
          <rect width="640" height="360" fill="white" />
          <circle cx="420" cy="176" r={radius} fill="black" />
        </mask>
      </defs>
      <rect width="640" height="360" fill="#020617" opacity=".5" mask="url(#github-real-spotlight-mask)" />
      <circle cx="420" cy="176" r={radius} fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="8 6" opacity=".9" />
    </svg>
  );
}

function AnnotationOverlay({frame}) {
  const opacity = interpolate(frame, [92, 116], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const offset = interpolate(opacity, [0, 1], [16, 0]);
  return (
    <svg width="640" height="360" viewBox="0 0 640 360" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}} opacity={opacity}>
      <g transform={`translate(0 ${offset})`}>
        <path d="M410 164C450 126 482 124 520 140" fill="none" stroke="#f59e0b" strokeWidth="3" />
        <path d="M510 134L522 140L512 148" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="420" y="84" width="164" height="42" rx="12" fill="#f59e0b" />
        <text x="434" y="110" fill="#111827" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700">Get started</text>
        <circle cx="410" cy="164" r="6" fill="#f59e0b" />
      </g>
    </svg>
  );
}

function TransitionPage({effectId, frame}) {
  if (effectId === 'transition-hard-cut') {
    return (
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Sequence from={0} durationInFrames={120}>
          <VideoLayer startFrom={0} />
        </Sequence>
        <Sequence from={120}>
          <VideoLayer startFrom={80} />
        </Sequence>
      </AbsoluteFill>
    );
  }

  const outgoingOpacity = valueAt(frame, [105, 135], [1, 0]);
  const incomingOpacity = valueAt(frame, [105, 135], [0, 1]);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Sequence from={0} durationInFrames={135}>
        <VideoLayer startFrom={0} style={{opacity: outgoingOpacity}} />
      </Sequence>
      <Sequence from={105}>
        <VideoLayer startFrom={80} style={{opacity: incomingOpacity}} />
      </Sequence>
    </AbsoluteFill>
  );
}

function RealPage({effectId, frame}) {
  if (effectId === 'camera-zoom') {
    return <TitleZoomPage frame={frame} />;
  }

  if (effectId === 'perspective-tilt') {
    return <PerspectiveTiltPage frame={frame} />;
  }

  if (effectId === 'transition-hard-cut' || effectId === 'transition-fade') {
    return <TransitionPage effectId={effectId} frame={frame} />;
  }

  const transform = pageTransform(effectId, frame);
  if (effectId === 'background-gradient-blur') {
    return (
      <AbsoluteFill style={{overflow: 'hidden', background: 'linear-gradient(135deg, #0f4c81, #35205e)'}}>
        <div style={{position: 'absolute', inset: -24, opacity: .55, filter: 'blur(24px)'}}>
          <VideoLayer style={{transform: 'scale(1.06)'}} />
        </div>
        <div style={{position: 'absolute', inset: 12, overflow: 'hidden', borderRadius: 20, boxShadow: '0 20px 48px rgba(0,0,0,.36)'}}>
          <VideoLayer style={{transform, transformOrigin: 'center center'}} />
        </div>
      </AbsoluteFill>
    );
  }

  if (effectId === 'frame-rounded-shadow') {
    return (
      <AbsoluteFill style={{padding: 18, overflow: 'hidden', background: '#0b1220'}}>
        <div style={{width: '100%', height: '100%', overflow: 'hidden', borderRadius: 24, boxShadow: '0 22px 52px rgba(0,0,0,.44)', transform}}>
          <VideoLayer />
        </div>
      </AbsoluteFill>
    );
  }

  if (effectId === 'browser-device-frame') {
    return (
      <AbsoluteFill style={{padding: 18, overflow: 'hidden', background: '#0b1220'}}>
        <div style={{height: '100%', overflow: 'hidden', borderRadius: 18, background: '#f8fafc', boxShadow: '0 22px 52px rgba(0,0,0,.42)', transform}}>
          <div style={{height: 34, display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', background: '#e2e8f0'}}>
            <span style={{width: 8, height: 8, borderRadius: 8, background: '#fb7185'}} />
            <span style={{width: 8, height: 8, borderRadius: 8, background: '#facc15'}} />
            <span style={{width: 8, height: 8, borderRadius: 8, background: '#4ade80'}} />
            <span style={{height: 16, flex: 1, marginLeft: 10, borderRadius: 8, background: '#f8fafc'}} />
          </div>
          <div style={{height: 'calc(100% - 34px)', overflow: 'hidden'}}><VideoLayer /></div>
        </div>
      </AbsoluteFill>
    );
  }

  return <VideoLayer style={{transform, transformOrigin: 'center center'}} />;
}

function Overlay({effectId, frame}) {
  if (effectId === 'cursor-smooth' || effectId === 'cursor-sway') return <CursorOverlay effectId={effectId} frame={frame} />;
  if (effectId === 'click-bounce') return <ClickOverlay frame={frame} />;
  if (effectId === 'spotlight') return <SpotlightOverlay frame={frame} />;
  if (effectId === 'annotation-callout') return <AnnotationOverlay frame={frame} />;
  return null;
}

export const EffectPreview = ({effectId = 'camera-zoom'}) => {
  const frame = useCurrentFrame();
  const safeEffectId = EFFECT_IDS.includes(effectId) ? effectId : 'camera-zoom';
  return (
    <AbsoluteFill style={{backgroundColor: '#0b1220', overflow: 'hidden'}}>
      <RealPage effectId={safeEffectId} frame={frame} />
      <Overlay effectId={safeEffectId} frame={frame} />
    </AbsoluteFill>
  );
};
