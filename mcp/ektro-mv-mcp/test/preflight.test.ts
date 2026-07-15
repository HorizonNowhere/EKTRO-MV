import { describe, expect, it } from 'vitest';
import { runPreflight } from '../src/preflight.js';

describe('runPreflight', () => {
  it('passes brief mode without an Anthropic key', async () => {
    const result = await runPreflight(
      { useBrief: true, includeSubtitles: false },
      {
        env: { ARK_API_KEY: 'ark', COMFYUI_URL: 'http://comfy.test' },
        nodeVersion: '20.18.0',
        commandAvailable: async () => true,
        urlAvailable: async () => true,
      },
    );
    expect(result.ok).toBe(true);
    expect(result.checks.map((row) => row.name)).not.toContain('anthropic_api_key');
  });

  it('reports all missing prompt-mode prerequisites without exposing values', async () => {
    const result = await runPreflight(
      { useBrief: false, includeSubtitles: false },
      {
        env: {},
        nodeVersion: '18.0.0',
        commandAvailable: async () => false,
        urlAvailable: async () => false,
      },
    );
    expect(result.ok).toBe(false);
    expect(result.checks.filter((row) => !row.ok).map((row) => row.name)).toEqual([
      'node',
      'anthropic_api_key',
      'ark_api_key',
      'comfyui',
      'ffmpeg',
      'ffprobe',
    ]);
  });

  it('checks Whisper only when subtitles are requested', async () => {
    const result = await runPreflight(
      { useBrief: true, includeSubtitles: true },
      {
        env: { ARK_API_KEY: 'ark' },
        nodeVersion: '22.0.0',
        commandAvailable: async () => true,
        urlAvailable: async () => true,
        packageAvailable: () => false,
      },
    );
    expect(result.ok).toBe(false);
    expect(result.checks.filter((row) => !row.ok).map((row) => row.name)).toEqual([
      'whisper_install_dir',
      'whisper_package',
    ]);
  });
});
