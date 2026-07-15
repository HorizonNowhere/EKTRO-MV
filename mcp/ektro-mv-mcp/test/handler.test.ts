import { describe, it, expect } from 'vitest';
import { handleCreate, handleDoctor, PROJECT_URL } from '../src/handler.js';

describe('handleCreate', () => {
  it('runs the engine and returns structured artifact metadata', async () => {
    const response = await handleCreate(
      { prompt: 'make a cyberpunk anthem', confirmedExternalCalls: true },
      {
        run: async () => ({
          runId: 'run-1',
          outputMp4: '/tmp/w/ektro-mv.mp4',
          briefTitle: 'Neon',
          workDir: '/tmp/w',
          subtitles: false,
        }),
      },
    );

    expect(response.isError).toBeFalsy();
    expect(response.structuredContent).toMatchObject({
      ok: true,
      runId: 'run-1',
      briefTitle: 'Neon',
      outputMp4: '/tmp/w/ektro-mv.mp4',
      projectUrl: PROJECT_URL,
    });
  });

  it('requires exactly one of prompt or brief', async () => {
    const deps = { run: async () => { throw new Error('must not run'); } };
    const empty = await handleCreate({}, deps);
    const both = await handleCreate({ prompt: 'x', brief: validBrief(), confirmedExternalCalls: true }, deps);
    expect(empty.isError).toBe(true);
    expect(empty.structuredContent).toMatchObject({ errorCode: 'invalid_input' });
    expect(both.isError).toBe(true);
    expect(both.structuredContent).toMatchObject({ errorCode: 'invalid_input' });
  });

  it('preserves stable runtime error codes', async () => {
    const error = Object.assign(new Error('missing prerequisites'), { errorCode: 'preflight_failed' });
    const response = await handleCreate({ prompt: 'x', confirmedExternalCalls: true }, { run: async () => { throw error; } });
    expect(response.isError).toBe(true);
    expect(response.structuredContent).toMatchObject({ ok: false, errorCode: 'preflight_failed' });
  });
});

describe('handleDoctor', () => {
  it('returns structured checks', async () => {
    const response = await handleDoctor(
      { useBrief: true },
      {
        doctor: async () => ({
          ok: true,
          message: 'ready',
          checks: [{ name: 'node', ok: true, required: true, message: 'Node 20' }],
          projectUrl: PROJECT_URL,
        }),
      },
    );
    expect(response.structuredContent).toMatchObject({ ok: true, message: 'ready' });
  });
});

function validBrief() {
  return {
    title: 'Neon',
    style: 'cyberpunk',
    language: 'en' as const,
    song: { tags: 'electronic', lyrics: 'wake up', durationSec: 30 },
    video: { prompt: 'neon city', ratio: '9:16' as const, resolution: '480p' as const },
  };
}
