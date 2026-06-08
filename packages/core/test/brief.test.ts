import { describe, it, expect } from 'vitest';
import { CreativeBriefSchema } from '../src/brief.js';

describe('CreativeBriefSchema', () => {
  it('parses a complete brief', () => {
    const brief = CreativeBriefSchema.parse({
      title: 'Against Entropy',
      style: 'cyberpunk awakening anthem',
      language: 'en',
      song: { tags: 'synthwave, female vocal, 120bpm', lyrics: 'verse...', durationSec: 200 },
      video: { prompt: 'neon city, rain', ratio: '9:16', resolution: '720p' },
    });
    expect(brief.video.ratio).toBe('9:16');
    expect(brief.song.durationSec).toBe(200);
  });

  it('applies defaults for ratio, resolution, language', () => {
    const brief = CreativeBriefSchema.parse({
      title: 'X',
      style: 'y',
      song: { tags: 't', lyrics: 'l', durationSec: 180 },
      video: { prompt: 'p' },
    });
    expect(brief.video.ratio).toBe('9:16');
    expect(brief.video.resolution).toBe('480p');
    expect(brief.language).toBe('zh');
  });

  it('rejects an invalid ratio', () => {
    expect(() =>
      CreativeBriefSchema.parse({
        title: 'X', style: 'y',
        song: { tags: 't', lyrics: 'l', durationSec: 180 },
        video: { prompt: 'p', ratio: '2:1' },
      }),
    ).toThrow();
  });
});
