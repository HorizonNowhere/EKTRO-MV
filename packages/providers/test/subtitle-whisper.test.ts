import { describe, it, expect } from 'vitest';
import { WhisperSubtitleProvider } from '../src/subtitle-whisper.js';
import type { CreativeBrief } from '@ektro-mv/core';

const brief: CreativeBrief = {
  title: 'T', style: 's', language: 'en',
  song: { tags: 't', lyrics: 'l', durationSec: 60 },
  video: { prompt: 'p', ratio: '9:16', resolution: '480p' },
};
const ctx = { workDir: '/tmp/x', log: () => {} };

describe('WhisperSubtitleProvider', () => {
  it('converts audio, transcribes, and returns the srt path', async () => {
    const calls: string[] = [];
    const p = new WhisperSubtitleProvider({
      ensure: async () => { calls.push('ensure'); },
      toWav: async (_in, out) => { calls.push('wav'); return out; },
      transcribe: async (_cfg, opts) => { calls.push('srt'); return [{ index: 1, startMs: 0, endMs: 1000, text: 'hi' }]; },
    });
    const res = await p.align('/tmp/x/song.flac', brief, ctx);
    expect(res.srtPath).toMatch(/\.srt$/);
    expect(calls).toEqual(['ensure', 'wav', 'srt']);
  });

  it('passes brief.language to the transcriber', async () => {
    let lang = '';
    const p = new WhisperSubtitleProvider({
      ensure: async () => {}, toWav: async (_i, o) => o,
      transcribe: async (_cfg, opts) => { lang = opts.language ?? ''; return []; },
    });
    await p.align('/a.flac', brief, ctx);
    expect(lang).toBe('en');
  });
});
