import { describe, it, expect } from 'vitest';
import { AceStepMusicProvider } from '../src/music-acestep.js';
import type { CreativeBrief } from '@ektro-mv/core';

const brief: CreativeBrief = {
  title: 'T', style: 's', language: 'en',
  song: { tags: 'synthwave, female vocal', lyrics: 'we rise', durationSec: 90 },
  video: { prompt: 'p', ratio: '9:16', resolution: '480p' },
};
const ctx = { workDir: '/tmp/x', log: () => {} };

function fakeClient(audioFilename: string) {
  return {
    queuePrompt: async () => ({ prompt_id: 'p1', number: 1, node_errors: {} }),
    waitPrompt: async () => ({ outputs: { '9': { audio: [{ filename: audioFilename, subfolder: '', type: 'output' }] } } }),
    downloadOutput: async () => new Uint8Array([1, 2, 3]).buffer,
  } as any;
}

describe('AceStepMusicProvider', () => {
  it('generates a song and returns its local path + duration', async () => {
    const writes: Array<{ path: string; bytes: number }> = [];
    const p = new AceStepMusicProvider({
      client: fakeClient('song_00001_.flac'),
      writeFile: async (path, data) => { writes.push({ path, bytes: data.byteLength }); },
      probeDuration: async () => 90,
    });
    const res = await p.generate(brief, ctx);
    expect(res.durationSec).toBe(90);
    expect(res.audioPath).toMatch(/\.flac$/);
    expect(writes[0].bytes).toBe(3);
  });

  it('throws when no audio output is produced', async () => {
    const p = new AceStepMusicProvider({
      client: { queuePrompt: async () => ({ prompt_id: 'p', number: 1, node_errors: {} }), waitPrompt: async () => ({ outputs: {} }), downloadOutput: async () => new ArrayBuffer(0) } as any,
      writeFile: async () => {}, probeDuration: async () => 0,
    });
    await expect(p.generate(brief, ctx)).rejects.toThrow(/ace-?step/i);
  });
});
