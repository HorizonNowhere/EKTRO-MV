import { describe, it, expect } from 'vitest';
import { runMv } from '../src/run.js';
import type { CreativeBrief } from '@ektro-mv/core';

const brief: CreativeBrief = {
  title: 'T', style: 's', language: 'en',
  song: { tags: 't', lyrics: 'l', durationSec: 30 },
  video: { prompt: 'p', ratio: '9:16', resolution: '480p' },
};

describe('runMv', () => {
  it('runs brain→music→video→subtitle→composite in order and returns mp4', async () => {
    const calls: string[] = [];
    const out = await runMv('make a song', {
      workDir: '/tmp/w',
      brain: { name: 'b', compose: async () => { calls.push('brain'); return brief; } },
      music: { name: 'm', generate: async () => { calls.push('music'); return { audioPath: '/a.flac', durationSec: 30 }; } },
      video: { name: 'v', generate: async () => { calls.push('video'); return { clipPaths: ['/c.mp4'] }; } },
      subtitle: { name: 's', align: async () => { calls.push('subtitle'); return { srtPath: '/s.srt' }; } },
      composite: { name: 'c', render: async () => { calls.push('composite'); return { outputMp4: '/out.mp4' }; } },
    });
    expect(calls).toEqual(['brain', 'music', 'video', 'subtitle', 'composite']);
    expect(out.outputMp4).toBe('/out.mp4');
    expect(out.brief.title).toBe('T');
  });

  it('skips the subtitle stage when no subtitle provider is given', async () => {
    const calls: string[] = [];
    let srtSeen: string | undefined = 'unset';
    await runMv('x', {
      workDir: '/tmp/w',
      brain: { name: 'b', compose: async () => brief },
      music: { name: 'm', generate: async () => ({ audioPath: '/a.flac', durationSec: 30 }) },
      video: { name: 'v', generate: async () => ({ clipPaths: ['/c.mp4'] }) },
      composite: { name: 'c', render: async (_b, input) => { calls.push('composite'); srtSeen = input.srtPath; return { outputMp4: '/out.mp4' }; } },
    });
    expect(calls).toEqual(['composite']);
    expect(srtSeen).toBeUndefined();
  });
});
