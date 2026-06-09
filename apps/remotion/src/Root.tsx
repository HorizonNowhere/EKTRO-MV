import React from 'react';
import { Composition } from 'remotion';
import { MusicVideo, musicVideoSchema } from './MusicVideo';

const RATIO = { width: 1080, height: 1920 }; // 9:16 default
const FPS = 30;

export const Root: React.FC = () => (
  <Composition
    id="MusicVideo"
    component={MusicVideo}
    durationInFrames={FPS * 10}
    fps={FPS}
    width={RATIO.width}
    height={RATIO.height}
    schema={musicVideoSchema}
    defaultProps={{ videoSrc: '', audioSrc: '', title: '', clipDurationSec: 10, captions: [] }}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round((props.captions.at(-1)?.endMs ?? 10000) / 1000 * FPS)) })}
  />
);
