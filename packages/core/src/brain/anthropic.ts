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
  "video": { "prompt": string, "shots": string[], "ratio": "9:16"|"16:9"|"1:1", "resolution": "480p"|"720p"|"1080p" }
}
Write full singable lyrics (verses + chorus). "video.prompt" is the overall scene.
"video.shots" is 3-5 distinct vivid shot descriptions (different angles/moments of that scene)
that will be generated as separate clips and sequenced across the song.`;

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const src = fenced ? fenced[1] : text;
  const start = src.indexOf('{');
  if (start === -1) throw new Error('brain: model output contained no JSON object');
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') { if (--depth === 0) return JSON.parse(src.slice(start, i + 1)); }
  }
  throw new Error('brain: model output contained no JSON object');
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
      const msg = parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
      throw new Error(`brain: model output failed schema validation: ${msg}`);
    }
    return parsed.data;
  }
}
