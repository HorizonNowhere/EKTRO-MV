import React from 'react';
import { AbsoluteFill, Audio, Loop, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { resolveUrl } from './resolveUrl.js';

export const captionSchema = z.object({ startMs: z.number(), endMs: z.number(), text: z.string() });

export const musicVideoSchema = z.object({
  videoSrc: z.string(),
  audioSrc: z.string(),
  title: z.string().default(''),
  clipDurationSec: z.number().positive().default(10),
  captions: z.array(captionSchema).default([]),
});
export type MusicVideoProps = z.infer<typeof musicVideoSchema>;

export const MusicVideo: React.FC<MusicVideoProps> = ({ videoSrc, audioSrc, title, clipDurationSec, captions }) => {
  const { fps } = useVideoConfig();
  const loopFrames = Math.max(1, Math.round(clipDurationSec * fps));
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Loop durationInFrames={loopFrames}>
        <OffthreadVideo src={resolveUrl(videoSrc)} muted />
      </Loop>
      <Audio src={resolveUrl(audioSrc)} />
      {title ? (
        <Sequence durationInFrames={Math.round(fps * 2)}>
          <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <h1 style={{ color: 'white', fontSize: 72, fontFamily: 'sans-serif', textShadow: '0 2px 12px #000' }}>{title}</h1>
          </AbsoluteFill>
        </Sequence>
      ) : null}
      <CaptionOverlay captions={captions} />
    </AbsoluteFill>
  );
};

const CaptionOverlay: React.FC<{ captions: MusicVideoProps['captions'] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const active = captions.find((c) => ms >= c.startMs && ms < c.endMs);
  if (!active) return null;
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 120 }}>
      <span style={{ color: 'white', fontSize: 44, fontFamily: 'sans-serif', textAlign: 'center', textShadow: '0 2px 10px #000', maxWidth: '85%' }}>{active.text}</span>
    </AbsoluteFill>
  );
};
