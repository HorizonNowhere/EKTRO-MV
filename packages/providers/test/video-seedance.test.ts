import { describe, it, expect } from 'vitest';
import { SeedanceVideoProvider } from '../src/video-seedance.js';
import type { CreativeBrief } from '@ektro-mv/core';

const brief: CreativeBrief = {
  title: 'T', style: 's', language: 'en',
  song: { tags: 't', lyrics: 'l', durationSec: 120 },
  video: { prompt: 'neon city', ratio: '9:16', resolution: '480p' },
};
const ctx = { workDir: '/tmp/x', log: () => {} };

function fakeClient(remoteUrl: string) {
  return {
    generateVideo: async () => ({ id: 'task1', status: 'succeeded', content: { video_url: remoteUrl } }),
  } as any;
}

describe('SeedanceVideoProvider', () => {
  it('generates a clip and returns its local path', async () => {
    const saved: string[] = [];
    const p = new SeedanceVideoProvider({
      client: fakeClient('https://cdn/v.mp4'),
      download: async (_url, dest) => { saved.push(dest); return dest; },
    });
    const res = await p.generate(brief, ctx);
    expect(res.clipPaths.length).toBe(1);
    expect(res.clipPaths[0]).toBe(saved[0]);
  });

  it('throws when the task has no video url', async () => {
    const p = new SeedanceVideoProvider({
      client: { generateVideo: async () => ({ id: 't', status: 'failed' }) } as any,
      download: async (_u, d) => d,
    });
    await expect(p.generate(brief, ctx)).rejects.toThrow(/seedance/i);
  });
});
