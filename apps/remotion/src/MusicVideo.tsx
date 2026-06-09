import React from 'react';
import { AbsoluteFill, Audio, Loop, OffthreadVideo, Sequence, Series, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { resolveUrl } from './resolveUrl';

export const captionSchema = z.object({ startMs: z.number(), endMs: z.number(), text: z.string() });
export const clipSchema = z.object({ src: z.string(), clipDurationSec: z.number().positive() });

export const musicVideoSchema = z.object({
  clips: z.array(clipSchema).default([]),
  audioSrc: z.string(),
  title: z.string().default(''),
  captions: z.array(captionSchema).default([]),
});
export type MusicVideoProps = z.infer<typeof musicVideoSchema>;

export const MusicVideo: React.FC<MusicVideoProps> = ({ clips, audioSrc, title, captions }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const n = clips.length;
  const slot = n > 0 ? Math.floor(durationInFrames / n) : durationInFrames;
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {n > 0 ? (
        <Series>
          {clips.map((c, i) => (
            <Series.Sequence
              key={i}
              durationInFrames={i === n - 1 ? Math.max(1, durationInFrames - slot * (n - 1)) : Math.max(1, slot)}
            >
              <Loop durationInFrames={Math.max(1, Math.round(c.clipDurationSec * fps))}>
                <OffthreadVideo src={resolveUrl(c.src)} muted />
              </Loop>
            </Series.Sequence>
          ))}
        </Series>
      ) : null}
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
