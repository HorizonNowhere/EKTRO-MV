import { describe, it, expect } from 'vitest';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StaticBrainProvider, loadBriefFile } from '../src/brain/static.js';
import type { CreativeBrief } from '../src/brief.js';

const brief: CreativeBrief = {
  title: 'Against Entropy', style: 'cyberpunk anthem', language: 'en',
  song: { tags: 'synthwave', lyrics: 'we rise', durationSec: 45 },
  video: { prompt: 'neon alley', ratio: '9:16', resolution: '480p' },
};

describe('StaticBrainProvider', () => {
  it('returns the provided brief regardless of input', async () => {
    const p = new StaticBrainProvider(brief);
    expect((await p.compose('ignored')).title).toBe('Against Entropy');
  });
});

describe('loadBriefFile', () => {
  it('loads and validates a brief JSON file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ektro-'));
    const path = join(dir, 'brief.json');
    await writeFile(path, JSON.stringify(brief));
    const loaded = await loadBriefFile(path);
    expect(loaded.song.durationSec).toBe(45);
  });

  it('throws a clear error on schema-invalid JSON', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ektro-'));
    const path = join(dir, 'bad.json');
    await writeFile(path, JSON.stringify({ title: 'x' }));
    await expect(loadBriefFile(path)).rejects.toThrow(/schema validation/i);
  });
});
