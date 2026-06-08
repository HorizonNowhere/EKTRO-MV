import { describe, it, expect } from 'vitest';
import { RemotionCompositeProvider } from '../src/remotion-composite.js';
import type { CreativeBrief } from '@ektro-mv/core';

const brief: CreativeBrief = {
  title: 'T', style: 's', language: 'en',
  song: { tags: 't', lyrics: 'l', durationSec: 12 },
  video: { prompt: 'p', ratio: '9:16', resolution: '480p' },
};
const ctx = { workDir: '/tmp/x', log: () => {} };

describe('RemotionCompositeProvider', () => {
  it('renders with captions parsed from srt and duration from audio', async () => {
    const seen: any = {};
    const p = new RemotionCompositeProvider({
      probeDuration: async () => 12,
      readSrt: async () => '1\n00:00:00,000 --> 00:00:02,000\nhi\n',
      render: async (opts) => { Object.assign(seen, opts); },
    });
    const res = await p.render(brief, { audioPath: '/a.flac', clipPaths: ['/c.mp4'], srtPath: '/s.srt' }, ctx);
    expect(res.outputMp4).toMatch(/\.mp4$/);
    expect(seen.durationInFrames).toBe(12 * 30);
    expect(seen.inputProps.captions).toEqual([{ startMs: 0, endMs: 2000, text: 'hi' }]);
    expect(seen.inputProps.audioSrc).toBe('/a.flac');
    expect(seen.inputProps.videoSrc).toBe('/c.mp4');
  });

  it('works without subtitles (empty captions)', async () => {
    const seen: any = {};
    const p = new RemotionCompositeProvider({
      probeDuration: async () => 5, render: async (o) => { Object.assign(seen, o); },
    });
    await p.render(brief, { audioPath: '/a.flac', clipPaths: ['/c.mp4'] }, ctx);
    expect(seen.inputProps.captions).toEqual([]);
  });
});
