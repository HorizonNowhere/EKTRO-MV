import { loadConfig, type EktroConfig } from '../config.js';
import { AnthropicBrainProvider } from './anthropic.js';
import type { CreativeBrief } from '../brief.js';

/**
 * Constructs a fresh {@link AnthropicBrainProvider} per call and is intended for one-shot use,
 * not hot loops. Callers needing repeated calls should construct an `AnthropicBrainProvider`
 * once and call `.compose()` directly.
 */
export async function composeBrief(
  oneLiner: string,
  config?: EktroConfig,
): Promise<CreativeBrief> {
  const cfg = config ?? loadConfig();
  const brain = new AnthropicBrainProvider({
    apiKey: cfg.brain.apiKey,
    baseURL: cfg.brain.baseURL,
    model: cfg.brain.model,
  });
  return brain.compose(oneLiner);
}
