import { readFile } from 'node:fs/promises';
import { CreativeBriefSchema, type CreativeBrief } from '../brief.js';
import type { BrainProvider } from '../providers.js';

/**
 * A brain that returns a pre-authored {@link CreativeBrief} instead of calling an LLM.
 *
 * Enables offline / deterministic runs and the "semi-automatic" flow: generate (or
 * hand-write) a brief, review it, then render — no API key required.
 */
export class StaticBrainProvider implements BrainProvider {
  readonly name = 'static';
  private brief: CreativeBrief;

  constructor(brief: CreativeBrief) {
    this.brief = brief;
  }

  async compose(_oneLiner: string): Promise<CreativeBrief> {
    return this.brief;
  }
}

/** Read + validate a CreativeBrief JSON file. Throws a clear error on bad JSON or schema mismatch. */
export async function loadBriefFile(path: string): Promise<CreativeBrief> {
  const raw = await readFile(path, 'utf8');
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    throw new Error(`brief: ${path} is not valid JSON (${(e as Error).message})`);
  }
  const parsed = CreativeBriefSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
    throw new Error(`brief: ${path} failed schema validation: ${msg}`);
  }
  return parsed.data;
}
