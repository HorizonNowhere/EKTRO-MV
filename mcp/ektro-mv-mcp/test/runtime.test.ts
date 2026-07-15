import { describe, expect, it } from 'vitest';
import { createRuntime, resolveWorkDir } from '../src/runtime.js';
import { PROJECT_URL } from '../src/handler.js';

const ready = async () => ({ ok: true, message: 'ready', checks: [], projectUrl: PROJECT_URL });

describe('createRuntime', () => {
  it('routes pipeline logs to stderr and keeps a deterministic bounded work directory', async () => {
    const stderr: string[] = [];
    const runtime = createRuntime({
      env: { ARK_API_KEY: 'ark', EKTRO_MV_OUTPUT_ROOT: '/tmp/ektro-root' },
      preflight: ready,
      randomId: () => 'run-123',
      stderr: (line) => stderr.push(line),
      runMvImpl: async (_prompt, deps) => {
        deps.log?.('pipeline message');
        return { outputMp4: `${deps.workDir}/ektro-mv.mp4`, brief: validBrief() };
      },
    });

    const result = await runtime.run({ brief: validBrief(), outputDir: 'jobs/demo', skipSubtitles: true, confirmedExternalCalls: true });
    expect(result).toMatchObject({
      runId: 'run-123',
      workDir: '/tmp/ektro-root/jobs/demo/run-123',
      subtitles: false,
    });
    expect(stderr).toEqual(['[ektro-mv:run-123] pipeline message']);
  });

  it('redacts configured secrets from provider errors', async () => {
    const runtime = createRuntime({
      env: { ARK_API_KEY: 'secret-ark-value' },
      preflight: ready,
      runMvImpl: async () => { throw new Error('provider echoed secret-ark-value'); },
    });
    await expect(runtime.run({ brief: validBrief(), skipSubtitles: true, confirmedExternalCalls: true })).rejects.toThrow('provider echoed [REDACTED]');
  });

  it('rejects overlapping generations and allows a later run after completion', async () => {
    let releaseFirst!: () => void;
    const firstRun = new Promise<void>((resolve) => { releaseFirst = resolve; });
    let invocations = 0;
    const runtime = createRuntime({
      env: { ARK_API_KEY: 'ark' },
      preflight: ready,
      runMvImpl: async (_prompt, deps) => {
        invocations += 1;
        if (invocations === 1) await firstRun;
        return { outputMp4: `${deps.workDir}/ektro-mv.mp4`, brief: validBrief() };
      },
    });
    const input = { brief: validBrief(), skipSubtitles: true, confirmedExternalCalls: true as const };

    const active = runtime.run(input);
    await expect(runtime.run(input)).rejects.toMatchObject({ errorCode: 'generation_in_progress' });
    releaseFirst();
    await active;
    await expect(runtime.run(input)).resolves.toMatchObject({ briefTitle: 'Neon' });
  });
});

describe('resolveWorkDir', () => {
  it('rejects absolute and escaping output paths', () => {
    expect(() => resolveWorkDir('/safe/root', '/tmp/out', 'run')).toThrow(/relative/);
    expect(() => resolveWorkDir('/safe/root', '../out', 'run')).toThrow(/escapes/);
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
