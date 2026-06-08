import { describe, it, expect } from 'vitest';
import { AnthropicBrainProvider } from '../src/brain/anthropic.js';

// Minimal fake matching the shape AnthropicBrainProvider calls.
function fakeClient(jsonText: string) {
  return {
    messages: {
      create: async () => ({ content: [{ type: 'text', text: jsonText }] }),
    },
  } as any;
}

const validBrief = JSON.stringify({
  title: 'Against Entropy', style: 'cyberpunk anthem', language: 'en',
  song: { tags: 'synthwave, female vocal', lyrics: 'we rise', durationSec: 200 },
  video: { prompt: 'neon city rain', ratio: '9:16', resolution: '720p' },
});

describe('AnthropicBrainProvider', () => {
  it('returns a validated brief from the model', async () => {
    const p = new AnthropicBrainProvider({ client: fakeClient(validBrief), model: 'm' });
    const brief = await p.compose('make a cyberpunk AI awakening anthem');
    expect(brief.title).toBe('Against Entropy');
    expect(brief.video.ratio).toBe('9:16');
  });

  it('extracts JSON when wrapped in prose/code fences', async () => {
    const wrapped = 'Here you go:\n```json\n' + validBrief + '\n```';
    const p = new AnthropicBrainProvider({ client: fakeClient(wrapped), model: 'm' });
    const brief = await p.compose('x');
    expect(brief.song.durationSec).toBe(200);
  });

  it('throws a clear error on unparseable output', async () => {
    const p = new AnthropicBrainProvider({ client: fakeClient('no json here'), model: 'm' });
    await expect(p.compose('x')).rejects.toThrow(/brain/i);
  });

  it('throws on schema-invalid model output', async () => {
    const invalid = JSON.stringify({
      title: 'X', style: 'y', language: 'en',
      song: { tags: 't', lyrics: 'l', durationSec: 9999 },
      video: { prompt: 'p', ratio: '9:16', resolution: '720p' },
    });
    const p = new AnthropicBrainProvider({ client: fakeClient(invalid), model: 'm' });
    await expect(p.compose('x')).rejects.toThrow(/brain/i);
  });
});
