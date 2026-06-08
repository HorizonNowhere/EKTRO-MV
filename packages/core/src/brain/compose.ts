import { loadConfig, type EktroConfig } from '../config.js';
import { AnthropicBrainProvider } from './anthropic.js';
import type { CreativeBrief } from '../brief.js';

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
