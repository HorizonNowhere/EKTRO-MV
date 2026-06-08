import Anthropic from '@anthropic-ai/sdk';
import { CreativeBriefSchema, type CreativeBrief } from '../brief.js';
import type { BrainProvider } from '../providers.js';

export interface AnthropicBrainOptions {
  client?: Anthropic;
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

const SYSTEM = `You are a music-video creative director.
Given one sentence, design a complete short music video.
Reply with ONLY a JSON object, no prose, matching exactly this shape:
{
  "title": string,
  "style": string,
  "language": "zh" | "en",
  "song": { "tags": string, "lyrics": string, "durationSec": number (30-300) },
  "video": { "prompt": string, "ratio": "9:16"|"16:9"|"1:1", "resolution": "480p"|"720p"|"1080p" }
}
Write full singable lyrics (verses + chorus). Keep video.prompt a single vivid scene.`;

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('brain: model output contained no JSON object');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export class AnthropicBrainProvider implements BrainProvider {
  readonly name = 'anthropic';
  private client: Anthropic;
  private model: string;

  constructor(opts: AnthropicBrainOptions = {}) {
    this.client =
      opts.client ??
      new Anthropic({ apiKey: opts.apiKey, baseURL: opts.baseURL });
    this.model = opts.model ?? 'claude-sonnet-4-20250514';
  }

  async compose(oneLiner: string): Promise<CreativeBrief> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: 'user', content: oneLiner }],
    });
    const block = res.content.find((b) => b.type === 'text');
    const text = block && 'text' in block ? block.text : '';
    let raw: unknown;
    try {
      raw = extractJson(text);
    } catch (e) {
      throw new Error(`brain: failed to parse model output (${(e as Error).message})`);
    }
    const parsed = CreativeBriefSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`brain: model output failed schema validation: ${parsed.error.message}`);
    }
    return parsed.data;
  }
}
