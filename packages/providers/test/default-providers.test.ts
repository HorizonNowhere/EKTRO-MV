import { describe, it, expect } from 'vitest';
import { defaultMediaProviders } from '../src/index.js';

describe('defaultMediaProviders', () => {
  it('builds the three media providers with names', () => {
    const { music, video, subtitle } = defaultMediaProviders({
      seedanceApiKey: 'k', comfyBaseUrl: 'http://localhost:8188',
    });
    expect(music.name).toBe('ace-step');
    expect(video.name).toBe('seedance');
    expect(subtitle.name).toBe('whisper');
  });
});
