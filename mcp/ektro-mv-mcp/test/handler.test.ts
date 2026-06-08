import { describe, it, expect } from 'vitest';
import { handleCreate } from '../src/handler.js';

describe('handleCreate', () => {
  it('runs the engine and returns the output path as MCP text content', async () => {
    let received = '';
    const res = await handleCreate(
      { prompt: 'make a cyberpunk anthem', workDir: '/tmp/w' },
      { run: async (oneLiner) => { received = oneLiner; return { outputMp4: '/tmp/w/ektro-mv.mp4', briefTitle: 'Neon' }; } },
    );
    expect(received).toBe('make a cyberpunk anthem');
    expect(res.isError).toBeFalsy();
    expect(res.content[0].text).toMatch(/ektro-mv\.mp4/);
    expect(res.content[0].text).toMatch(/Neon/);
  });

  it('returns an error result when the engine throws', async () => {
    const res = await handleCreate(
      { prompt: 'x' },
      { run: async () => { throw new Error('seedance down'); } },
    );
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/seedance down/);
  });

  it('rejects an empty prompt', async () => {
    const res = await handleCreate({ prompt: '' }, { run: async () => ({ outputMp4: 'x', briefTitle: 't' }) });
    expect(res.isError).toBe(true);
  });
});
