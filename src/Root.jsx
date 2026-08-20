import React from 'react';
import {Composition} from 'remotion';
import {EffectPreview, EFFECT_PREVIEW_SPEC} from './EffectPreview.jsx';

export const Root = () => (
  <>
    <Composition
      id="EffectPreview"
      component={EffectPreview}
      durationInFrames={EFFECT_PREVIEW_SPEC.durationInFrames}
      fps={EFFECT_PREVIEW_SPEC.fps}
      width={EFFECT_PREVIEW_SPEC.width}
      height={EFFECT_PREVIEW_SPEC.height}
      defaultProps={{effectId: 'camera-zoom'}}
    />
  </>
);
