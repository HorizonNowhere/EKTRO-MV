import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('reads brain config from an env-like object', () => {
    const cfg = loadConfig({
      ANTHROPIC_API_KEY: 'sk-x',
      EKTRO_BRAIN_MODEL: 'claude-test',
    });
    expect(cfg.brain.apiKey).toBe('sk-x');
    expect(cfg.brain.model).toBe('claude-test');
  });

  it('falls back to the default model when unset', () => {
    const cfg = loadConfig({ ANTHROPIC_API_KEY: 'sk-x' });
    expect(cfg.brain.model).toBe('claude-sonnet-4-20250514');
  });

  it('throws when the brain key is missing', () => {
    expect(() => loadConfig({})).toThrow(/ANTHROPIC_API_KEY/);
  });
});
