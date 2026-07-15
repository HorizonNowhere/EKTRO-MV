import { describe, it, expect } from 'vitest';
import { downloadVideo, SeedanceClient } from '../src/clients/seedance.js';
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

  it('generates one clip per shot when brief.video.shots is set', async () => {
    const saved: string[] = [];
    let calls = 0;
    const multi: CreativeBrief = { ...brief, video: { ...brief.video, shots: ['a', 'b', 'c'] } };
    const p = new SeedanceVideoProvider({
      client: { generateVideo: async () => { calls++; return { id: 't', status: 'succeeded', content: { video_url: 'https://cdn/v.mp4' } }; } } as any,
      download: async (_url, dest) => { saved.push(dest); return dest; },
    });
    const res = await p.generate(multi, ctx);
    expect(calls).toBe(3);
    expect(res.clipPaths.map((p) => p.replace(/.*[\\/]/, ''))).toEqual(['clip-0.mp4', 'clip-1.mp4', 'clip-2.mp4']);
  });

  it('throws when the task has no video url', async () => {
    const p = new SeedanceVideoProvider({
      client: { generateVideo: async () => ({ id: 't', status: 'failed' }) } as any,
      download: async (_u, d) => d,
    });
    await expect(p.generate(brief, ctx)).rejects.toThrow(/seedance/i);
  });
});

describe('downloadVideo', () => {
  it('does not expose signed URL credentials when a download fails', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response('', { status: 403 });
    try {
      await expect(downloadVideo(
        'https://user:pass@cdn.example/video.mp4?token=temporary-secret#fragment',
        '/tmp/ektro-mv-security-test/video.mp4',
        1,
      )).rejects.toThrow('download HTTP 403: https://cdn.example/video.mp4');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('SeedanceClient', () => {
  it('redacts its API key if an upstream error echoes it', async () => {
    const client = new SeedanceClient({
      apiKey: 'secret-ark-value',
      retries: 0,
      fetchImpl: async () => new Response('Authorization: Bearer secret-ark-value', { status: 400 }),
    });

    await expect(client.createTask({ model: 'test-model', content: [] }))
      .rejects.toThrow('Authorization: Bearer [REDACTED]');
  });
});
